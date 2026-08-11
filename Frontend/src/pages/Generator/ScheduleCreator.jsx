import "./ScheduleCreator.css";
import { ROUTES } from "../../routes.js";
import { useState, useRef } from "react";
import { useUser } from "../../UserContext";
import { downloadSchedulePDF } from "../../comp/schedulePDF";

import { goToNav } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";

import downloadImg from "/assets/transDL.webp";
import fileImg from "/assets/transFilePurple.webp";

function ScheduleCreator() {
  const { userData, programInfo, setScheduleRequest } = useUser();

  const [error, setError] = useState("");
  const [isCheckingTranscript, setIsCheckingTranscript] = useState(false);
  const [transcriptInvalid, setTranscriptInvalid] = useState(false);

  const goTo = goToNav();
  const fileInputRef = useRef(null);

  const firstName = userData.name?.trim().split(/\s+/)[0] || "User";
  const possessiveName = firstName.endsWith("s")
    ? `${firstName}'`
    : `${firstName}'s`;

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

  /* ===========================
     Schedule Data
  =========================== */

  const scheduleData = userData?.schedule || {};

  const schedule = Array.isArray(scheduleData.schedule)
    ? scheduleData.schedule
    : [];

  const tabs = Array.isArray(scheduleData.tabs) ? scheduleData.tabs : [];

  const selectedPlan = scheduleData.selectedPlan || null;

  const completedTab = tabs.find((tab) => tab.id === "completed") || {};

  const completedCourses = Array.isArray(completedTab.completedCourses)
    ? completedTab.completedCourses
    : [];

  const waivedOrTransferred = Array.isArray(completedTab.waivedOrTransferred)
    ? completedTab.waivedOrTransferred
    : [];

  const inProgressCourses = Array.isArray(completedTab.inProgressCourses)
    ? completedTab.inProgressCourses
    : [];

  const notes = Array.isArray(completedTab.notes) ? completedTab.notes : [];

  const hasSchedule = schedule.length > 0;

  /*
   * "plan" represents the Your Plan tab.
   * Every schedule term gets its own tab.
   */
  const [activeTab, setActiveTab] = useState("plan");

  /* ===========================
     Profile Handlers
  =========================== */

  const handleGeneratePlan = async () => {
    setError("");

    if (transcriptInvalid) {
      setError(
        "Please upload a valid transcript or remove the invalid transcript before generating a plan."
      );
      return;
    }

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

  /* ===========================
     Formatting
  =========================== */

  const formatTerm = (term) => {
    if (!term) return "";

    return term.replace(/([A-Za-z]+)(\d{4})/, "$1 $2");
  };

  /*
   * Find the currently selected semester.
   */
  const activeSemester =
    activeTab !== "plan"
      ? schedule.find((semester) => semester.term === activeTab)
      : null;

  const handleDownloadPDF = () => {
    try {
      downloadSchedulePDF({
        userData,
        profile,
        selectedPlan,
        completedCourses,
        waivedOrTransferred,
        inProgressCourses,
        notes,
        schedule,
        formatTerm,
      });
    } catch (err) {
      setError("Could not generate the PDF. Please try again.");
    }
  };

  return (
    <div className="gradientBackground scheduleCreatorPage">
      <div className="landingOverlay">
        <div className="scheduleLayout">
          {/* ===========================
              Profile Panel
          =========================== */}

          <div className="authCard profilePanel">
            <h1 className="formTitle">{possessiveName} Profile</h1>

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

          {/* ===========================
              Schedule Panel
          =========================== */}

          <div className="schedulePanel">
            <div className="scheduleTitleRow">
              <h1 className="formTitle">{possessiveName} Schedule</h1>

              {hasSchedule && (
                <button
                  className="downloadButton"
                  type="button"
                  onClick={handleDownloadPDF}
                  aria-label="Download schedule as PDF"
                  title="Download schedule as PDF"
                >
                  <img
                    src={downloadImg}
                    className="downloadIcon"
                    alt="Download schedule"
                  />
                </button>
              )}
            </div>

            {!hasSchedule ? (
              <div className="schedulePlaceholder">Generate a Schedule</div>
            ) : (
              <div className="scheduleContent">
                {/* ===========================
                    Main Tabs
                =========================== */}

                <div className="scheduleTabs">
                  <button
                    type="button"
                    className={`scheduleTab ${
                      activeTab === "plan" ? "scheduleTabActive" : ""
                    }`}
                    onClick={() => setActiveTab("plan")}
                  >
                    Your Plan
                  </button>

                  {schedule.map((semester) => (
                    <button
                      type="button"
                      className={`scheduleTab ${
                        activeTab === semester.term ? "scheduleTabActive" : ""
                      }`}
                      key={semester.term}
                      onClick={() => setActiveTab(semester.term)}
                    >
                      {formatTerm(semester.term)}
                    </button>
                  ))}
                </div>

                {/* ===========================
                    Your Plan
                =========================== */}

                {activeTab === "plan" && (
                  <div className="scheduleTabContent">
                    <section className="scheduleSection">
                      <h2 className="scheduleSectionTitle">Your Plan</h2>

                      <div className="scheduleInfoCard planCard">
                        {selectedPlan ? (
                          <>
                            <div className="planHeader">
                              <div>
                                <p className="planLabel">Selected Plan</p>

                                <h3 className="planName">
                                  {selectedPlan.name}
                                </h3>
                              </div>
                            </div>

                            {selectedPlan.rationale && (
                              <div className="planRationaleContainer">
                                <p className="planLabel">Rationale</p>

                                <p className="planRationale">
                                  {selectedPlan.rationale}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="emptyScheduleText">
                            No plan information available.
                          </p>
                        )}
                      </div>
                    </section>

                    {/* Completed Courses */}

                    <section className="scheduleSection">
                      <h2 className="scheduleSectionTitle">
                        Completed Courses
                      </h2>

                      <div className="scheduleInfoCard">
                        {completedCourses.length > 0 ? (
                          <div className="courseTagList">
                            {completedCourses.map((course, index) => (
                              <span
                                className="courseTag"
                                key={`${course}-${index}`}
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="emptyScheduleText">
                            No completed courses listed.
                          </p>
                        )}
                      </div>
                    </section>

                    {/* Waived / Transferred */}

                    <section className="scheduleSection">
                      <h2 className="scheduleSectionTitle">
                        Waived / Transferred
                      </h2>

                      <div className="scheduleInfoCard">
                        {waivedOrTransferred.length > 0 ? (
                          <div className="courseTagList">
                            {waivedOrTransferred.map((course, index) => (
                              <span
                                className="courseTag"
                                key={`${course}-${index}`}
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="emptyScheduleText">None</p>
                        )}
                      </div>
                    </section>

                    {/* In Progress */}

                    <section className="scheduleSection">
                      <h2 className="scheduleSectionTitle">In Progress</h2>

                      <div className="scheduleInfoCard">
                        {inProgressCourses.length > 0 ? (
                          <div className="courseTagList">
                            {inProgressCourses.map((course, index) => (
                              <span
                                className="courseTag"
                                key={`${course}-${index}`}
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="emptyScheduleText">None</p>
                        )}
                      </div>
                    </section>

                    {/* Notes */}

                    {notes.length > 0 && (
                      <section className="scheduleSection">
                        <h2 className="scheduleSectionTitle">
                          Additional Note
                        </h2>

                        <div className="scheduleInfoCard notesCard">
                          All generated schedules are suggestions by AI. There
                          can be mistakes so please double-check results.
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* ===========================
                    Selected Term
                =========================== */}

                {activeTab !== "plan" && activeSemester && (
                  <div className="scheduleTabContent">
                    <section className="scheduleSection">
                      <div className="termContentHeader">
                        <div>
                          <p className="termEyebrow">Recommended Schedule</p>

                          <h2 className="termTitle">
                            {formatTerm(activeSemester.term)}
                          </h2>
                        </div>

                        <div className="semesterCredits">
                          {activeSemester.credits} Total Credits
                        </div>
                      </div>

                      <div className="courseList">
                        {Array.isArray(activeSemester.courses) &&
                        activeSemester.courses.length > 0 ? (
                          activeSemester.courses.map((course, index) => (
                            <div
                              className="courseCard"
                              key={`${course.course}-${index}`}
                            >
                              <div className="courseCardHeader">
                                <div className="courseHeading">
                                  <h3 className="courseName">{course.name}</h3>

                                  <span className="courseCode">
                                    {course.course}
                                  </span>
                                </div>

                                <div className="courseCredits">
                                  {course.credits ?? 0} Credits
                                </div>
                              </div>

                              {course.rationale && (
                                <div className="courseRationale">
                                  <p className="courseRationaleLabel">
                                    Why this course
                                  </p>

                                  <p className="courseRationaleText">
                                    {course.rationale}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="schedulePlaceholder">
                            No courses scheduled for{" "}
                            {formatTerm(activeSemester.term)}.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCreator;
