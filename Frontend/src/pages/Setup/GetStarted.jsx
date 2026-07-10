import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./GetStarted.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";

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

const majors = ["Computer Science"];

function GetStarted() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("Undergrad");
  const [major, setMajor] = useState("");
  const [startingSemester, setStartingSemester] = useState("");
  const [endingSemester, setEndingSemester] = useState("");
  const [credits, setCredits] = useState("");
  const [showToast, setShowToast] = useState(false);
  const { setUserData } = useUser();

  const handleNext = () => {
    if (Number(credits) > 18) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    setUserData({
      name,
      degreeLevel,
      major,
      startingSemester,
      endingSemester,
      credits,
    });
    navigate("/transcript");
  };

  return (
    <div className="getStartedContainer">
      <div
        className="getStartedBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="formCard">
          <p className="formTitle">Let's Get Started</p>

          <p className="formLabel">What's your name?</p>
          <input
            className="formInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
          />

          <p className="formLabel">Degree Level</p>
          <div className="toggleContainer">
            <p
              className={`toggleOption ${
                degreeLevel === "Undergrad" ? "toggleActive" : ""
              }`}
              onClick={() => setDegreeLevel("Undergrad")}
            >
              Undergrad
            </p>
            <p
              className={`toggleOption ${
                degreeLevel === "Graduate" ? "toggleActive" : ""
              }`}
              onClick={() => setDegreeLevel("Graduate")}
            >
              Graduate
            </p>
          </div>

          <p className="formLabel">What's your major?</p>
          <select
            className="formSelect"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          >
            <option value="">Select</option>
            {majors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <div className="semesterRow">
            <div className="semesterColumn">
              <p className="formLabel">Starting Semester</p>
              <select
                className="formSelect"
                value={startingSemester}
                onChange={(e) => setStartingSemester(e.target.value)}
              >
                <option value="">Select</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="semesterColumn">
              <p className="formLabel">Ending Semester</p>
              <select
                className="formSelect"
                value={endingSemester}
                onChange={(e) => setEndingSemester(e.target.value)}
              >
                <option value="">Select</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="formLabel">How many credits per semester</p>
          <input
            className="formInput formInputSmall"
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            placeholder="Max 18 credits"
          />

          <div className="nextButtonContainer">
            <p className="nextButton" onClick={handleNext}>
              Next
            </p>
          </div>
        </div>
      </div>
      {showToast && (
        <div className="toast">Maximum 18 credits per semester</div>
      )}
    </div>
  );
}

export default GetStarted;
