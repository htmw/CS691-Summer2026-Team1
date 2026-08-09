import "./ScheduleCreator.css";
import { ROUTES } from "../../routes.js";
import { useState, useRef } from "react";
import { useUser } from "../../UserContext";

import { goToNav } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";


import downloadImg from "/assets/downloadIcon.png";
import fileImg from "/assets/file.png";

function ScheduleCreator() {
  const { userData, programInfo, setScheduleRequest } = useUser();
  const [error, setError] = useState("");
  const [isCheckingTranscript, setIsCheckingTranscript] = useState(false);
  const [transcriptInvalid, setTranscriptInvalid] = useState(false);

  const goTo = goToNav();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(() => ({
    degreeLevel: userData.degreeLevel || "Undergrad",
    major: userData.major || "",
    startingSemester: userData.startingSemester || "",
    endingSemester: userData.endingSemester || "",
    credits: userData.credits || "",
    transcript: userData.transcript || {
      data: "",
      name: "",
    },
    chat: userData.chat || "",
  }));

  const hasTranscript = Boolean(profile.transcript?.data);

  const handleGeneratePlan = async () => {
    setError("");

    // A transcript is optional, but if one was uploaded and failed
    // verification, don't allow the plan to be generated.
    if (transcriptInvalid) {
      setError(
        "Please upload a valid transcript or remove the invalid transcript before generating a plan."
      );
      return;
    }

    // Don't generate while the transcript is being checked.
    if (isCheckingTranscript) {
      return;
    }

    const isSameProfile =
      profile.degreeLevel === userData.degreeLevel &&
      profile.major === userData.major &&
      profile.startingSemester === userData.startingSemester &&
      profile.endingSemester === userData.endingSemester &&
      profile.credits === userData.credits &&
      profile.chat === userData.chat &&
      profile.transcript?.data === userData.transcript?.data &&
      profile.transcript?.name === userData.transcript?.name;

    if (isSameProfile) {
      setError(
        "No changes detected. Please update your profile before generating a new plan."
      );
      return;
    }

    setScheduleRequest({
      degreeLevel: profile.degreeLevel,
      major: profile.major,
      startingSemester: profile.startingSemester,
      endingSemester: profile.endingSemester,
      credits: profile.credits,
      transcript: profile.transcript,
      chat: profile.chat,
    });

    goTo(ROUTES.SCHEDULELOAD);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    event.target.value = "";

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("PDF file size must be less than 5 MB.");
      return;
    }

    setError("");
    setTranscriptInvalid(false);
    setIsCheckingTranscript(true);

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
      });

      // Keep the uploaded file in state even while checking it
      setProfile((prev) => ({
        ...prev,
        transcript: {
          data: dataUrl,
          name: file.name,
        },
      }));

      const request = {
        data: dataUrl,
        name: file.name,
      };

      const response = await postReq("/api/transcriptCheck", request);

      if (!response.is_transcript) {
        setTranscriptInvalid(true);

        setError(
          "That file doesn't look like a transcript. Please upload a document showing your coursework, credits, and grades."
        );

        return;
      }

      // Transcript is valid
      setTranscriptInvalid(false);
      setError("");
    } catch (err) {
      console.error("Transcript verification failed:", err);

      setTranscriptInvalid(true);

      setError("Could not verify the transcript. Please try again.");
    } finally {
      setIsCheckingTranscript(false);
    }
  };

  const deleteTranscript = () => {
    setProfile((prev) => ({
      ...prev,
      transcript: {
        data: "",
        name: "",
      },
    }));

    setTranscriptInvalid(false);
    setError("");
  };

  const [activeYear, setActiveYear] = useState("2027");
  const [schedule, setSchedule] = useState([]);

  const hasSchedule =
    userData?.schedule && Object.keys(userData.schedule).length > 0;

  // Get unique years from the schedule
  const years = [...new Set(schedule.map((sem) => sem.semester.split(" ")[1]))];

  // Filter semesters by active year tab
  const filteredSchedule = schedule.filter((sem) =>
    sem.semester.includes(activeYear)
  );

  return (
    <div className="gradientBackground scheduleCreatorPage">
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
                    profile.degreeLevel === "Undergrad"
                      ? "toggleActive"
                      : "toggleInActive"
                  }`}
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      degreeLevel: "Undergrad",
                    }))
                  }
                >
                  Undergrad
                </button>

                <button
                  className={`toggleOption ${
                    profile.degreeLevel === "Graduate"
                      ? "toggleActive"
                      : "toggleInActive"
                  }`}
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      degreeLevel: "Graduate",
                    }))
                  }
                >
                  Graduate
                </button>
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">Major</label>

              <select
                className="formInput"
                value={profile.major}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    major: e.target.value,
                  }))
                }
              >
                <option value="">Select</option>

                {programInfo.majors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label className="formLabel">Starting Semester</label>

              <select
                className="formInput"
                value={profile.startingSemester}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    startingSemester: e.target.value,
                  }))
                }
              >
                {programInfo.semesters.map((s) => (
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
                value={profile.endingSemester}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    endingSemester: e.target.value,
                  }))
                }
              >
                {programInfo.semesters.map((s) => (
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
                value={profile.credits}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    credits: e.target.value,
                  }))
                }
              />
            </div>

            <div className="formGroup scheduleTranscript">
              <label className="formLabel">Upload Transcript</label>

              <p className="transcriptLimit">5MB Limit</p>

              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                className="hiddenInput"
                onChange={handleFileUpload}
                disabled={isCheckingTranscript}
              />

              <div
                className={`transcriptContainer ${
                  isCheckingTranscript ? "transcriptChecking" : ""
                }`}
                onClick={() => {
                  if (!isCheckingTranscript) {
                    fileInputRef.current?.click();
                  }
                }}
              >

                {isCheckingTranscript ? (

                <img
                  src="/assets/transFilePurple.webp"
                  alt="file upload"
                  className="fileimg"
                />

                {hasTranscript ? (
                  <>
                    <div className="transcriptLoader"></div>

                    <p className="uploadText">Verifying transcript...</p>

                    <p className="transcriptCheckingText">Please wait</p>
                  </>
                ) : (
                  <>
                    <img src={fileImg} alt="file upload" className="fileimg" />

                    {hasTranscript ? (
                      <>
                        <p className="uploadText">{profile.transcript.name}</p>

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
                  </>
                )}
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">Ask for something else</label>

              <textarea
                className="detailsTextarea formTextarea"
                value={profile.chat}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    chat: e.target.value,
                  }))
                }
                placeholder="i.e. put more focus on math"
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <button
              className="heroButton nextButton"
              onClick={handleGeneratePlan}
              disabled={isCheckingTranscript || transcriptInvalid}
            >
              {isCheckingTranscript
                ? "Verifying Transcript..."
                : "Generate Plan"}
            </button>
          </div>

          {/* Schedule Panel */}
          <div className="schedulePanel">
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
              {hasSchedule ? (
                filteredSchedule.map((sem) => (
                  <div className="semesterCard" key={sem.semester}>
                    <h2 className="semesterName">{sem.semester}</h2>

                    {sem.courses.map((course, i) => (
                      <p className="courseName" key={i}>
                        {course}
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <div className="schedulePlaceholder">Generate a Schedule</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCreator;
