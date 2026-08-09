import "./ScheduleCreator.css";
import { ROUTES } from "../../routes.js";
import { useState, useRef } from "react";
import { useUser } from "../../UserContext";
import { jsPDF } from "jspdf";

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
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 42;
      const contentWidth = pageWidth - margin * 2;

      let y = 0;

      // =========================
      // Colors
      // =========================

      const purple = [91, 55, 130];
      const darkPurple = [55, 32, 80];
      const lightPurple = [245, 240, 250];
      const lighterPurple = [250, 248, 252];

      const dark = [45, 45, 50];
      const gray = [105, 105, 115];
      const lightGray = [225, 225, 230];
      const white = [255, 255, 255];
      const green = [55, 130, 90];

      // =========================
      // Helpers
      // =========================

      const checkPage = (height = 30) => {
        if (y + height > pageHeight - 55) {
          doc.addPage();
          drawPageHeader();
          y = 78;
        }
      };

      const drawPageHeader = () => {
        doc.setFillColor(...purple);
        doc.rect(0, 0, pageWidth, 8, "F");
      };

      const roundedBox = (x, top, width, height, fillColor, radius = 8) => {
        doc.setFillColor(...fillColor);
        doc.roundedRect(x, top, width, height, radius, radius, "F");
      };

      const addWrappedText = (text, x, top, width, options = {}) => {
        const {
          fontSize = 10,
          color = dark,
          bold = false,
          lineHeight = 14,
        } = options;

        const lines = doc.splitTextToSize(String(text || ""), width);

        doc.setFont("helvetica", bold ? "bold" : "normal");

        doc.setFontSize(fontSize);
        doc.setTextColor(...color);

        doc.text(lines, x, top);

        return lines.length * lineHeight;
      };

      const addSectionTitle = (title) => {
        checkPage(45);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(...darkPurple);

        doc.text(title, margin, y);

        y += 24;
      };

      const addTagList = (items) => {
        if (!items || items.length === 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...gray);
          doc.text("None", margin + 12, y);

          y += 18;
          return;
        }

        let x = margin;
        let rowHeight = 28;

        items.forEach((item) => {
          const text = String(item);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);

          const textWidth = doc.getTextWidth(text) + 22;

          if (x + textWidth > margin + contentWidth) {
            x = margin;
            y += rowHeight;
          }

          checkPage(rowHeight);

          doc.setFillColor(...lightPurple);

          doc.roundedRect(x, y - 15, textWidth, 23, 11, 11, "F");

          doc.setTextColor(...purple);
          doc.text(text, x + 11, y);

          x += textWidth + 7;
        });

        y += rowHeight;
      };

      // =========================
      // PAGE HEADER
      // =========================

      drawPageHeader();

      // =========================
      // Main Header
      // =========================

      y = 48;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...darkPurple);

      doc.text(`${userData?.name || "Student"}'s`, margin, y);

      y += 28;

      doc.setFontSize(20);
      doc.setTextColor(...purple);

      doc.text("Academic Schedule", margin, y);

      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);

      doc.text(
        `Generated ${new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        margin,
        y
      );

      y += 28;

      // =========================
      // PROFILE CARD
      // =========================

      checkPage(150);

      const profileHeight = 145;

      roundedBox(margin, y, contentWidth, profileHeight, lighterPurple);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...darkPurple);

      doc.text("Student Profile", margin + 18, y + 25);

      // divider

      doc.setDrawColor(...lightGray);

      doc.line(margin + 18, y + 36, margin + contentWidth - 18, y + 36);

      const leftX = margin + 18;
      const rightX = margin + contentWidth / 2 + 5;

      const row1 = y + 57;
      const row2 = y + 85;
      const row3 = y + 113;

      const profileField = (label, value, x, top) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...gray);

        doc.text(label.toUpperCase(), x, top);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...dark);

        doc.text(String(value || "N/A"), x, top + 13);
      };

      profileField("Degree", profile.degreeLevel, leftX, row1);

      profileField("Major", profile.major, rightX, row1);

      profileField(
        "Starting",
        formatTerm(profile.startingSemester),
        leftX,
        row2
      );

      profileField("Ending", formatTerm(profile.endingSemester), rightX, row2);

      profileField("Credits", profile.credits, leftX, row3);

      profileField(
        "Transcript",
        profile.transcript?.name || "No transcript",
        rightX,
        row3
      );

      y += profileHeight + 28;

      // =========================
      // ADDITIONAL REQUEST
      // =========================

      if (profile.chat) {
        checkPage(85);

        addSectionTitle("Additional Request");

        const requestLines = doc.splitTextToSize(
          profile.chat,
          contentWidth - 30
        );

        const requestHeight = requestLines.length * 14 + 30;

        roundedBox(margin, y - 5, contentWidth, requestHeight, lighterPurple);

        addWrappedText(profile.chat, margin + 15, y + 15, contentWidth - 30, {
          fontSize: 10,
          color: dark,
          lineHeight: 14,
        });

        y += requestHeight + 18;
      }

      // =========================
      // SELECTED PLAN
      // =========================

      if (selectedPlan) {
        addSectionTitle("Your Plan");

        checkPage(130);

        const rationaleLines = selectedPlan.rationale
          ? doc.splitTextToSize(selectedPlan.rationale, contentWidth - 36)
          : [];

        const goals = Array.isArray(selectedPlan.honoredAspects)
          ? selectedPlan.honoredAspects
          : [];

        const goalHeight = goals.length > 0 ? goals.length * 14 + 10 : 0;

        const planHeight = 72 + rationaleLines.length * 14 + goalHeight;

        roundedBox(margin, y, contentWidth, planHeight, lightPurple);

        // Plan name

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...darkPurple);

        doc.text(selectedPlan.name || "Selected Plan", margin + 18, y + 25);

        // Score

        if (typeof selectedPlan.score === "number") {
          const scoreText = `${Math.round(selectedPlan.score * 100)}%`;

          doc.setFillColor(...green);

          doc.roundedRect(
            margin + contentWidth - 70,
            y + 12,
            52,
            25,
            12,
            12,
            "F"
          );

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...white);

          doc.text(scoreText, margin + contentWidth - 44, y + 29, {
            align: "center",
          });
        }

        let planY = y + 48;

        if (selectedPlan.rationale) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...gray);

          doc.text("RATIONALE", margin + 18, planY);

          planY += 13;

          planY += addWrappedText(
            selectedPlan.rationale,
            margin + 18,
            planY,
            contentWidth - 36,
            {
              fontSize: 9,
              color: dark,
              lineHeight: 13,
            }
          );

          planY += 8;
        }

        if (goals.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...gray);

          doc.text("GOALS HONORED", margin + 18, planY);

          planY += 13;

          goals.forEach((goal) => {
            planY += addWrappedText(
              `• ${goal}`,
              margin + 20,
              planY,
              contentWidth - 40,
              {
                fontSize: 9,
                color: dark,
                lineHeight: 13,
              }
            );
          });
        }

        y += planHeight + 28;
      }

      // =========================
      // COURSE HISTORY
      // =========================

      const historySections = [
        {
          title: "Completed Courses",
          items: completedCourses,
        },
        {
          title: "Waived / Transferred",
          items: waivedOrTransferred,
        },
        {
          title: "In Progress",
          items: inProgressCourses,
        },
      ];

      historySections.forEach(({ title, items }) => {
        addSectionTitle(title);

        addTagList(items);

        y += 8;
      });

      // =========================
      // NOTES
      // =========================

      if (notes.length > 0) {
        addSectionTitle("Additional Notes");

        checkPage(50);

        notes.forEach((note) => {
          const lines = doc.splitTextToSize(`• ${note}`, contentWidth - 20);

          checkPage(lines.length * 14 + 5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...dark);

          doc.text(lines, margin + 10, y);

          y += lines.length * 14 + 4;
        });

        y += 10;
      }

      // =========================
      // RECOMMENDED SCHEDULE
      // =========================

      addSectionTitle("Recommended Schedule");

      schedule.forEach((semester) => {
        const courses = Array.isArray(semester.courses) ? semester.courses : [];

        checkPage(85);

        // Semester header

        roundedBox(margin, y, contentWidth, 48, purple);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(...white);

        doc.text(formatTerm(semester.term), margin + 16, y + 22);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        doc.text(`${semester.credits ?? 0} Total Credits`, margin + 16, y + 37);

        y += 62;

        if (courses.length === 0) {
          addWrappedText(
            "No courses scheduled for this semester.",
            margin + 5,
            y,
            contentWidth - 10,
            {
              fontSize: 10,
              color: gray,
            }
          );

          y += 30;
          return;
        }

        courses.forEach((course) => {
          const rationaleLines = course.rationale
            ? doc.splitTextToSize(course.rationale, contentWidth - 36)
            : [];

          const cardHeight = 70 + rationaleLines.length * 13;

          /*
           * If the course card won't fit,
           * start it on a new page.
           */
          checkPage(cardHeight + 10);

          roundedBox(margin, y, contentWidth, cardHeight, [250, 249, 251]);

          // Course code

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...purple);

          doc.text(course.course || "", margin + 16, y + 19);

          // Course name

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...dark);

          doc.text(course.name || "Unnamed Course", margin + 16, y + 38);

          // Credits badge

          const creditText = `${course.credits ?? 0} Credits`;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);

          const creditWidth = doc.getTextWidth(creditText) + 18;

          doc.setFillColor(...lightPurple);

          doc.roundedRect(
            margin + contentWidth - creditWidth - 15,
            y + 13,
            creditWidth,
            22,
            11,
            11,
            "F"
          );

          doc.setTextColor(...purple);

          doc.text(creditText, margin + contentWidth - creditWidth - 6, y + 27);

          // Rationale

          if (course.rationale) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...gray);

            doc.text("WHY THIS COURSE", margin + 16, y + 57);

            addWrappedText(
              course.rationale,
              margin + 16,
              y + 70,
              contentWidth - 32,
              {
                fontSize: 9,
                color: dark,
                lineHeight: 13,
              }
            );
          }

          y += cardHeight + 12;
        });

        y += 8;
      });

      // =========================
      // FOOTERS
      // =========================

      const totalPages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);

        // Bottom divider

        doc.setDrawColor(...lightGray);

        doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);

        // Left footer

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...gray);

        doc.text(
          `${userData?.name || "Student"} • Academic Schedule`,
          margin,
          pageHeight - 25
        );

        // Right footer

        doc.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 25,
          {
            align: "right",
          }
        );
      }

      // =========================
      // DOWNLOAD
      // =========================

      const safeName = (userData?.name || "Student")
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_");

      doc.save(`${safeName}_Academic_Schedule.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);

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
              <h1 className="formTitle">{userData.name}'s Schedule</h1>

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

                              {typeof selectedPlan.score === "number" && (
                                <div className="planScore">
                                  {Math.round(selectedPlan.score * 100)}%
                                </div>
                              )}
                            </div>

                            {selectedPlan.rationale && (
                              <div className="planRationaleContainer">
                                <p className="planLabel">Rationale</p>

                                <p className="planRationale">
                                  {selectedPlan.rationale}
                                </p>
                              </div>
                            )}

                            {Array.isArray(selectedPlan.honoredAspects) &&
                              selectedPlan.honoredAspects.length > 0 && (
                                <div className="planSubsection">
                                  <h4>Goals Honored</h4>

                                  <ul>
                                    {selectedPlan.honoredAspects.map(
                                      (aspect, index) => (
                                        <li key={index}>{aspect}</li>
                                      )
                                    )}
                                  </ul>
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
                          Additional Notes
                        </h2>

                        <div className="scheduleInfoCard notesCard">
                          <ul>
                            {notes.map((note, index) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
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
