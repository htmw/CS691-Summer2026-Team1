import "./ScheduleCreator.css";
import { useState, useRef } from "react";
import { useUser} from "../../UserContext";
import downloadImg from "/assets/downloadIcon.png";

const semesters = [
  "Fall 2024",
  "Spring 2025",
  "Fall 2025",
  "Spring 2026",
  "Fall 2026",
  "Spring 2027",
  "Fall 2027",
  "Spring 2028",
];

function ScheduleCreator() {
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");

  const [degreeLevel, setDegreeLevel] = useState("Undergrad");
  const [startingSemester, setStartingSemester] = useState("Fall 2027");
  const [endingSemester, setEndingSemester] = useState("Spring 2027");
  const [credits, setCredits] = useState("12");
  const [ask, setAsk] = useState("");
  const [activeYear, setActiveYear] = useState("2027");
  const { userData, updateUserData } = useUser();

  const schedule = [
    {
      semester: "Fall 2026",
      courses: [
        "ENG 101 - English Composition",
        "PHIL 200 - Ethics",
        "CS 150 - Web Development",
        "MATH 201 - Calculus I",
      ],
    },
    {
      semester: "Spring 2027",
      courses: [
        "CS 101 - Intro to a Computer",
        "Lit 123 - Shakespearean Shakespeare",
        "Math 303 - Algebra 16",
        "CS 200 - Data/Data",
      ],
    },
    {
      semester: "Fall 2027",
      courses: [
        "CS 301 - Algorithms",
        "MATH 400 - Linear Algebra",
        "CS 350 - Operating Systems",
        "PHYS 101 - Physics I",
      ],
    },
    {
      semester: "Spring 2028",
      courses: [
        "CS 400 - Machine Learning",
        "CS 410 - Databases",
        "MATH 450 - Statistics",
        "CS 490 - Senior Project",
      ],
    },
    {
      semester: "Fall 2028",
      courses: [
        "CS 499 - Capstone",
        "BUS 300 - Entrepreneurship",
        "CS 420 - Security",
        "COMM 200 - Public Speaking",
      ],
    },
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    event.target.value = "";

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (file.size > maxSize) {
      setError("PDF file size must be less than 5 MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      updateUserData("transcript", {
        data: reader.result,
        name: file.name,
      });
    };

    reader.readAsDataURL(file);
  };

  const deleteTranscript = () => {
    updateUserData("transcript", {
      data: "",
      name: "",
    });
    setError("");
  };

  const hasTranscript = userData.transcript?.data;

  // Get unique years from the schedule
  const years = [...new Set(schedule.map((sem) => sem.semester.split(" ")[1]))];

  // Filter semesters by active year tab
  const filteredSchedule = schedule.filter((sem) =>
    sem.semester.includes(activeYear)
  );

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <div className="scheduleLayout">
          {/* Profile Panel */}
          <div className="authCard profilePanel">
            <h1 className="formTitle">{userData.name}'s Profile</h1>

            <div className="formGroup">
              <label className="formLabel">Degree Level</label>

              <div className="toggleContainer">
                <button
                  className={`toggleOption ${
                    degreeLevel === "Undergrad" ? "toggleActive" : ""
                  }`}
                  onClick={() => setDegreeLevel("Undergrad")}
                >
                  Undergrad
                </button>

                <button
                  className={`toggleOption ${
                    degreeLevel === "Graduate" ? "toggleActive" : ""
                  }`}
                  onClick={() => setDegreeLevel("Graduate")}
                >
                  Graduate
                </button>
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">Starting Semester</label>

              <select
                className="formInput"
                value={startingSemester}
                onChange={(e) => setStartingSemester(e.target.value)}
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label className="formLabel">Ending Semester</label>

              <select
                className="formInput"
                value={endingSemester}
                onChange={(e) => setEndingSemester(e.target.value)}
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label className="formLabel">Credits</label>

              <input
                className="formInput"
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
            </div>

            <div className="formGroup scheduleTranscript">
              <label className="formLabel">Upload Transcript (Optional)</label>

              <p className="transcriptLimit">5MB Limit</p>

              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                className="hiddenInput"
                onChange={handleFileUpload}
              />

              <div
                className="transcriptContainer"
                onClick={() => fileInputRef.current.click()}
              >
                <img
                  src="/assets/file.png"
                  alt="file upload"
                  className="fileimg"
                />

                {hasTranscript ? (
                  <>
                    <p className="uploadText">{userData.transcript.name}</p>

                    <button
                      className="deleteText"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTranscript();
                      }}
                    >
                      Delete PDF
                    </button>
                  </>
                ) : (
                  <p className="uploadText">Click to upload your PDF</p>
                )}
              </div>

              {error && <div className="errorMessage">{error}</div>}
            </div>


            <div className="formGroup">
              <label className="formLabel">Ask for something else</label>

              <textarea
                className="detailsTextarea"
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="i.e. put more focus on math"
              />
            </div>

            <button className="heroButton nextButton">Next</button>
          </div>

          {/* Schedule Panel */}
          <div className="authCard schedulePanel">
            <div className="scheduleTitleRow">
              <h1 className="formTitle">{userData.name}'s Schedule</h1>

              <button className="downloadButton">
                <img
                  src={downloadImg}
                  className="downloadIcon"
                  alt="Download schedule"
                />
              </button>
            </div>

            <div className="yearTabs">
              {years.map((year) => (
                <button
                  key={year}
                  className={`yearTab ${
                    activeYear === year ? "yearTabActive" : ""
                  }`}
                  onClick={() => setActiveYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="semesterList">
              {filteredSchedule.map((sem) => (
                <div className="semesterCard" key={sem.semester}>
                  <h2 className="semesterName">{sem.semester}</h2>

                  {sem.courses.map((course, i) => (
                    <p className="courseName" key={i}>
                      {course}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCreator;
