def schedule_solve(data: dict) -> dict:
    recommendation = data.get("recommendation") or {}

#---

    standing = data.get("standing") or {}
    metadata = data.get("metadata") or {}

    completed_courses = standing.get("completed_courses") or []
    waived_or_transferred = standing.get("waived_or_transferred") or []
    in_progress_courses = standing.get("in_progress_courses") or []

    notes = recommendation.get("notes") or []
    notes.extend(metadata.get("assumptions") or [])
    notes.extend(metadata.get("needs_confirmation") or [])

    if metadata.get("unparsed_notes"):
        notes.append(metadata["unparsed_notes"])

    completed_tab = {
        "id": "completed",
        "title": "Completed Courses",
        "completedCourses": completed_courses,
        "waivedOrTransferred": waived_or_transferred,
        "inProgressCourses": in_progress_courses,
        "notes": notes,
    }

#---

    score_by_course = {}
    for ranking in recommendation.get("elective_rankings") or []:
        course = ranking.get("course")
        if course:
            score_by_course[course] = ranking.get("score", 0)

    name_by_course = {}
    credits_by_course = {}
    reason_by_course = {}
    for ranking in recommendation.get("elective_rankings") or []:
        course = ranking.get("course")
        if course:
            name_by_course[course] = ranking.get("name", course)
            credits_by_course[course] = ranking.get("credits", 3)
            reason_by_course[course] = ranking.get("reason", "")

    remaining = recommendation.get("remaining_requirements") or {}
    capstone_id = remaining.get("capstone")
    if capstone_id:
        if remaining.get("capstone_name"):
            name_by_course[capstone_id] = remaining["capstone_name"]
        if remaining.get("capstone_credits") is not None:
            credits_by_course[capstone_id] = remaining["capstone_credits"]
        reason_by_course[capstone_id] = "Required capstone, taken at the end of the program."


    for c in recommendation.get("core_courses") or []:
        course = c.get("course")
        if course:
            name_by_course.setdefault(course, c.get("name", course))
            credits_by_course.setdefault(course, c.get("credits", 3))
            reason_by_course.setdefault(course, "Required core course for your program.")

#----

    candidate_plans = recommendation.get("candidate_plans") or []

    if not candidate_plans:
        return {
            "tabs": [completed_tab],
            "selectedPlan": None,
            "schedule": [],
        }

    best_plan = max(
        candidate_plans,
        key=lambda plan: plan.get("overall_score", 0),
    )

#---

    schedule = []

    for term in best_plan.get("terms") or []:
        courses = term.get("courses") or []

        sorted_courses = sorted(
            courses,
            key=lambda course: score_by_course.get(course, 0),
            reverse=True,
        )

        course_objects = []
        for course in sorted_courses:
            course_objects.append({
                "course": course,
                "name": name_by_course.get(course, course),
                "score": score_by_course.get(course, 0),
                "credits": credits_by_course.get(course, 3),
                "rationale": reason_by_course.get(course, ""),
            })

        schedule.append({
            "term": term.get("term"),
            "courses": course_objects,
            "credits": term.get("credits", 0),
        })


    return {
        "tabs": [
            completed_tab,
            {
                "id": "schedule",
                "title": "Recommended Schedule",
            },
        ],
        "selectedPlan": {
            "name": best_plan.get("plan_name"),
            "score": best_plan.get("overall_score", 0),
            "rationale": best_plan.get("rationale"),
            "honoredAspects": best_plan.get("honored_aspects") or [],
        },
        "schedule": schedule,
    }
