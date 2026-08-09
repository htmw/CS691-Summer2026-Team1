import "./SetupStyles.css";
import { ROUTES } from "../../routes.js";
import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { goToNav, RegularLink } from "../../comp/linking";

function GetStarted() {
  const { setUserData, userData, signUpData, loggedIn, programInfo } =
    useUser();

  const [name, setName] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("Undergrad");
  const [major, setMajor] = useState("");
  const [startingSemester, setStartingSemester] = useState("");
  const [endingSemester, setEndingSemester] = useState("");
  const [credits, setCredits] = useState("");

  const [error, setError] = useState("");
  const goTo = goToNav();

  const nameRegex = /^[A-Za-z ]+$/;

  const handleNext = () => {
    if (
      !name.trim() ||
      !major ||
      !startingSemester ||
      !endingSemester ||
      !credits
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!nameRegex.test(name.trim())) {
      setError("Name can only contain letters.");
      return;
    }

    if (Number(credits) < 1) {
      setError("Must take at least one credit.");
      return;
    }

    if (Number(credits) > 18) {
      setError("Maximum 18 credits per semester.");
      return;
    }

    const startIndex = programInfo.semesters.indexOf(startingSemester);
    const endIndex = programInfo.semesters.indexOf(endingSemester);

    if (endIndex <= startIndex) {
      setError("Ending semester must be after starting semester.");
      return;
    }

    setError("");

    setUserData((prev) => ({
      ...prev,
      name,
      degreeLevel,
      major,
      startingSemester,
      endingSemester,
      credits,
    }));

    goTo(ROUTES.TRANSCRIPT);
  };

  useEffect(() => {
    if (!signUpData.email || !signUpData.password) {
      console.log("No Data");
      console.log(signUpData.email);
      console.log(signUpData.password);
      goTo(ROUTES.SIGNUP);
      return;
    }
  }, [signUpData.email, signUpData.password, goTo]);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setDegreeLevel(userData.degreeLevel || "Undergrad");
      setMajor(userData.major || "");
      setStartingSemester(userData.startingSemester || "");
      setEndingSemester(userData.endingSemester || "");
      setCredits(userData.credits || "");
    }
  }, [userData]);

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <div className="authCard setupCard">
          <div className="setupContent">
            <h1 className="formTitle">Let's Get Started</h1>

            <div className="formGroup">
              <label className="formLabel">What's your name?</label>

              <input
                className="formInput"
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[A-Za-z ]*$/.test(value)) {
                    setName(value);
                  }
                }}
                placeholder="Your Name"
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">Degree Level</label>

              <div className="toggleContainer">
                <button
                  className={`toggleOption ${
                    degreeLevel === "Undergrad"
                      ? "toggleActive"
                      : "toggleInActive"
                  }`}
                  onClick={() => setDegreeLevel("Undergrad")}
                >
                  Undergrad
                </button>

                <button
                  className={`toggleOption ${
                    degreeLevel === "Graduate"
                      ? "toggleActive"
                      : "toggleInActive"
                  }`}
                  onClick={() => setDegreeLevel("Graduate")}
                >
                  Graduate
                </button>
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">What's your major?</label>

              <select
                className="formInput"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              >
                <option value="">Select</option>

                {programInfo.majors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="semesterRow">
              <div className="semesterColumn">
                <label className="formLabel">Starting Semester</label>

                <select
                  className="formInput"
                  value={startingSemester}
                  onChange={(e) => setStartingSemester(e.target.value)}
                >
                  <option value="">Select</option>

                  {programInfo.semesters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="semesterColumn">
                <label className="formLabel">Ending Semester</label>

                <select
                  className="formInput"
                  value={endingSemester}
                  onChange={(e) => setEndingSemester(e.target.value)}
                >
                  <option value="">Select</option>

                  {programInfo.semesters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">How many credits per semester</label>

              <input
                className="formInput"
                type="text"
                inputMode="numeric"
                value={credits}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow clearing the input
                  if (value === "") {
                    setCredits("");
                    return;
                  }

                  // Only allow numbers
                  if (/^\d+$/.test(value)) {
                    const number = Number(value);

                    // Force range 1-18
                    if (number >= 1 && number <= 18) {
                      setCredits(value);
                    }
                  }
                }}
                placeholder="Max 18 credits"
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <div className="formActions">
              <button className="heroButton nextButton" onClick={handleNext}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GetStarted;
