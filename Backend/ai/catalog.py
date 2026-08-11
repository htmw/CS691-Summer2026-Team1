"""
catalog.py — Layer 1 of the IAPO catalog-reasoning layer.

Loads every catalog CSV into one in-memory Catalog object that the AI
reasoning layer (and the solver, if it wants) can query. Database-agnostic:
point `from_dir` at a folder of CSVs today, swap in `from_records` (fed by
DynamoDB) later without touching any code that consumes a Catalog.

Handles the real data's quirks so downstream code never has to:
  - drops the trailing empty column in courses_offered
  - parses CareerTags / CourseKeywords JSON-array strings into real lists
  - normalizes MeetingDay (single day / async / JSON array / mangled quotes)
    into a clean day list + is_async flag
  - parses HH:MM times into minutes-since-midnight for conflict math later
"""
from __future__ import annotations
from aws import info_table
from fastapi import HTTPException



import csv
import json
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Set

Row = Dict[str, str]

# Canonical weekday names, indexed for ordering.
_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
_DAY_LOOKUP = {d.lower(): d for d in _WEEKDAYS}
for _d in list(_DAY_LOOKUP):
    _DAY_LOOKUP[_d[:3]] = _DAY_LOOKUP[_d]  # mon, tue, ...


def canon_day(value: str) -> Optional[str]:
    """Map any spelling/casing of a weekday to its canonical name, else None."""
    if not value:
        return None
    key = str(value).strip().strip('"').strip("'").lower()
    if key in _DAY_LOOKUP:
        return _DAY_LOOKUP[key]
    for name in _WEEKDAYS:                       # substring fallback (" wednesday ")
        if name.lower() in key:
            return name
    return None


def parse_day_list(raw: str) -> List[str]:
    """Turn any MeetingDay / day-value string into a list of canonical weekdays."""
    if raw is None:
        return []
    s = str(raw).strip()
    if not s or "async" in s.lower():
        return []
    parts: List[str] = []
    try:                                          # JSON array form: ["Thursday","Tuesday"]
        val = json.loads(s)
        if isinstance(val, list):
            parts = [str(x) for x in val]
        elif isinstance(val, str):
            parts = [val]
    except Exception:
        cleaned = s.strip("[]").replace('"', "").replace("'", "")
        parts = [p for p in cleaned.split(",")]
    out: List[str] = []
    for p in parts:
        d = canon_day(p)
        if d and d not in out:
            out.append(d)
    return sorted(out, key=_WEEKDAYS.index)


def parse_hhmm(raw: str) -> Optional[int]:
    """'18:30' / '0:00' -> minutes since midnight; None if unparseable."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    try:
        h, m = s.split(":")
        return int(h) * 60 + int(m)
    except Exception:
        return None


def _read_csv(path: Path) -> List[Row]:
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        rows: List[Row] = []
        for raw in reader:
            row: Row = {}
            for k, v in raw.items():
                if k is None:
                    continue
                key = k.strip()
                if key == "":                     # trailing empty column in courses_offered
                    continue
                row[key] = v.strip() if isinstance(v, str) else v
            rows.append(row)
        return rows




class Catalog:
    def __init__(self, tables: Dict[str, List[Row]]):
        # normalize a few known aliases so lookups are stable regardless of filename
        aliases = {
            "courses_offered__1_": "courses_offered",
            "degree_requiremtns": "degree_requirements",  # sic (real filename typo)
            "department": "departments",
        }
        self.tables: Dict[str, List[Row]] = {}
        for name, rows in tables.items():
            self.tables[aliases.get(name, name)] = rows
        self._build_indexes()

    # ---------- loading ----------
    @classmethod
    def from_dir(cls, path: str) -> "Catalog":
        tables: Dict[str, List[Row]] = {}
        for f in sorted(Path(path).glob("*.csv")):
            tables[f.stem.lower()] = _read_csv(f)
        return cls(tables)

    @classmethod
    def from_records(cls, tables: Dict[str, List[Row]]) -> "Catalog":
        """For when rows come from DynamoDB instead of CSV files."""
        return cls({k.lower(): v for k, v in tables.items()})

    # ---------- generic access ----------
    def table(self, name: str) -> List[Row]:
        return self.tables.get(name.lower(), [])

    def has(self, name: str) -> bool:
        return bool(self.tables.get(name.lower()))

    # ---------- typed views ----------
    def semesters(self) -> List[Row]:           return self.table("IAPO_Semester")
    def prerequisites(self) -> List[Row]:       return self.table("IAPO_Prerequisites")
    def major_course(self) -> List[Row]:        return self.table("IAPO_Major_Courses")
    def majors(self) -> List[Row]:              return self.table("IAPO_Majors")
    def courses(self) -> List[Row]:             return self.table("IAPO_Courses")
    def courses_offered(self) -> List[Row]:     return self.table("IAPO_Courses_Offered")
    def degree_requirements(self) -> List[Row]: return self.table("IAPO_Degree_Requirements")
    def constraints(self) -> List[Row]:         return self.table("IAPO_Student_Constraints")
    def departments(self) -> List[Row]:         return self.table("IAPO_Departments")


    # ---------- lookups ----------
    def course(self, course_id) -> Optional[Row]:
        return self._courses_by_id.get(str(course_id))

    def course_name(self, course_id) -> Optional[str]:
        c = self.course(course_id)
        return c.get("CourseName") if c else None

    def credits(self, course_id) -> Optional[int]:
        c = self.course(course_id)
        if not c:
            return None
        try:
            return int(c.get("Credits"))
        except Exception:
            return None

    def career_tags(self, course_id) -> List[str]:
        c = self.course(course_id)
        return c.get("_CareerTags", []) if c else []

    def course_keywords(self, course_id) -> List[str]:
        c = self.course(course_id)
        return c.get("_CourseKeywords", []) if c else []

    def prereqs_for(self, course_id) -> Set[str]:
        return set(self._prereqs.get(str(course_id), set()))

    def courses_by_requirement(self, requirement_type: str, major_id=None) -> List[str]:
        out: List[str] = []
        for r in self.major_course():
            if r.get("RequirementType") == requirement_type:
                if major_id is None or r.get("MajorID") == str(major_id):
                    out.append(r.get("CourseID"))
        return out

    def electives(self, major_id) -> List[str]:  return self.courses_by_requirement("Elective", major_id)
    def core(self, major_id) -> List[str]:       return self.courses_by_requirement("Core", major_id)
    def capstone(self, major_id) -> List[str]:   return self.courses_by_requirement("Capstone", major_id)
    def bridge(self, major_id) -> List[str]:     return self.courses_by_requirement("Bridge", major_id)

    def degree_requirement(self, major_id) -> Optional[Row]:
        return self._degreq_by_major.get(str(major_id))

    def electives_needed(self, major_id) -> Optional[int]:
        """How many elective *courses* (not credits) the major requires."""
        req = self.degree_requirement(major_id)
        if not req:
            return None
        try:
            elec_credits = int(req.get("ElectiveCreditsRequired"))
        except Exception:
            return None
        elects = self.electives(major_id)
        per = self.credits(elects[0]) if elects else 3
        per = per or 3
        return elec_credits // per

    def offerings_for(self, course_id, semester_id=None) -> List[Row]:
        rows = self._offerings_by_course.get(str(course_id), [])
        if semester_id is None:
            return list(rows)
        return [r for r in rows if r.get("SemesterID") == semester_id]

    def semesters_in_order(self) -> List[Row]:
        return self._semesters_ordered

    def major_id_for_name(self, name: str) -> Optional[str]:
        """Resolve a MajorName (e.g. 'Cybersecurity', as selected in the UI dropdown)
        to its MajorID. Case-insensitive, tolerates surrounding whitespace."""
        if not name:
            return None
        target = str(name).strip().lower()
        for r in self.majors():
            if (r.get("MajorName") or "").strip().lower() == target:
                return r.get("MajorID")
        return None

    # ---------- indexes ----------
    def _build_indexes(self) -> None:
        # courses: attach parsed list fields
        self._courses_by_id: Dict[str, Row] = {}
        for r in self.courses():
            r["_CareerTags"] = _json_list(r.get("CareerTags"))
            r["_CourseKeywords"] = _json_list(r.get("CourseKeywords"))
            self._courses_by_id[r.get("CourseID")] = r

        # prereq map: course -> set(prereq courses)
        self._prereqs: Dict[str, Set[str]] = {}
        for r in self.prerequisites():
            c, p = r.get("CourseID"), r.get("PrereqCourseID")
            if c:
                self._prereqs.setdefault(c, set())
                if p:
                    self._prereqs[c].add(p)

        # degree requirements by major
        self._degreq_by_major = {r.get("MajorID"): r for r in self.degree_requirements()}

        # offerings: attach normalized day list + minute times, index by course
        self._offerings_by_course: Dict[str, List[Row]] = {}
        for r in self.courses_offered():
            r["_Days"] = parse_day_list(r.get("MeetingDay"))
            r["_Async"] = len(r["_Days"]) == 0
            r["_StartMin"] = parse_hhmm(r.get("StartTime"))
            r["_EndMin"] = parse_hhmm(r.get("EndTime"))
            self._offerings_by_course.setdefault(r.get("CourseID"), []).append(r)

        # semesters chronological by StartDate
        def _skey(r: Row):
            try:
                return datetime.strptime(r.get("StartDate", ""), "%Y-%m-%d").date()
            except Exception:
                return date.max
        self._semesters_ordered = sorted(self.semesters(), key=_skey)

    def summary(self) -> str:
        return "\n".join(f"{name}: {len(rows)} rows"
                         for name, rows in sorted(self.tables.items()))


def _json_list(raw) -> List[str]:
    """Parse a JSON-array string ('[\"a\",\"b\"]') into a list; tolerate junk."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw]
    s = str(raw).strip()
    if not s:
        return []
    try:
        val = json.loads(s)
        if isinstance(val, list):
            return [str(x).strip() for x in val]
        return [str(val).strip()]
    except Exception:
        return [p.strip() for p in s.strip("[]").replace('"', "").split(",") if p.strip()]

#---------
def get_programInfo():
    semesters_response = info_table.get_item(
        Key={"infoID": "semesters"}
    )

    majors_response = info_table.get_item(
        Key={"infoID": "majors"}
    )

    semesters_item = semesters_response.get("Item")
    majors_item = majors_response.get("Item")

    if not semesters_item or not majors_item:
        raise HTTPException(
            status_code=404,
            detail="Information not found"
        )

    return {
        "semesters": semesters_item["information"],
        "majors": majors_item["information"]
    }