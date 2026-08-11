import { jsPDF } from "jspdf";

export const downloadSchedulePDF = ({
  userData,
  profile,
  selectedPlan,
  completedCourses,
  waivedOrTransferred,
  inProgressCourses,
  notes,
  schedule,
  formatTerm,
}) => {
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

    const drawPageHeader = () => {
      doc.setFillColor(...purple);
      doc.rect(0, 0, pageWidth, 8, "F");
    };

    const checkPage = (height = 30) => {
      if (y + height > pageHeight - 55) {
        doc.addPage();
        drawPageHeader();
        y = 78;
      }
    };

    const roundedBox = (
      x,
      top,
      width,
      height,
      fillColor,
      radius = 8
    ) => {
      doc.setFillColor(...fillColor);
      doc.roundedRect(
        x,
        top,
        width,
        height,
        radius,
        radius,
        "F"
      );
    };

    const addWrappedText = (
      text,
      x,
      top,
      width,
      options = {}
    ) => {
      const {
        fontSize = 10,
        color = dark,
        bold = false,
        lineHeight = 14,
      } = options;

      const lines = doc.splitTextToSize(
        String(text || ""),
        width
      );

      doc.setFont(
        "helvetica",
        bold ? "bold" : "normal"
      );

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
      const rowHeight = 28;

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

        doc.roundedRect(
          x,
          y - 15,
          textWidth,
          23,
          11,
          11,
          "F"
        );

        doc.setTextColor(...purple);
        doc.text(text, x + 11, y);

        x += textWidth + 7;
      });

      y += rowHeight;
    };

    // =========================
    // Page Header
    // =========================

    drawPageHeader();

    // =========================
    // Main Header
    // =========================

    y = 48;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...darkPurple);

    doc.text(
      `${userData?.name || "Student"}'s`,
      margin,
      y
    );

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
    // Profile Card
    // =========================

    checkPage(150);

    const profileHeight = 145;

    roundedBox(
      margin,
      y,
      contentWidth,
      profileHeight,
      lighterPurple
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...darkPurple);

    doc.text(
      "Student Profile",
      margin + 18,
      y + 25
    );

    doc.setDrawColor(...lightGray);

    doc.line(
      margin + 18,
      y + 36,
      margin + contentWidth - 18,
      y + 36
    );

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

    profileField(
      "Degree",
      profile.degreeLevel,
      leftX,
      row1
    );

    profileField(
      "Major",
      profile.major,
      rightX,
      row1
    );

    profileField(
      "Starting",
      formatTerm(profile.startingSemester),
      leftX,
      row2
    );

    profileField(
      "Ending",
      formatTerm(profile.endingSemester),
      rightX,
      row2
    );

    profileField(
      "Credits",
      profile.credits,
      leftX,
      row3
    );

    profileField(
      "Transcript",
      profile.transcript?.name || "No transcript",
      rightX,
      row3
    );

    y += profileHeight + 28;

    // =========================
    // Additional Request
    // =========================

    if (profile.chat) {
      checkPage(85);

      addSectionTitle("Additional Request");

      const requestLines = doc.splitTextToSize(
        profile.chat,
        contentWidth - 30
      );

      const requestHeight =
        requestLines.length * 14 + 30;

      roundedBox(
        margin,
        y - 5,
        contentWidth,
        requestHeight,
        lighterPurple
      );

      addWrappedText(
        profile.chat,
        margin + 15,
        y + 15,
        contentWidth - 30,
        {
          fontSize: 10,
          color: dark,
          lineHeight: 14,
        }
      );

      y += requestHeight + 18;
    }

    // =========================
    // Selected Plan
    // =========================

    if (selectedPlan) {
      addSectionTitle("Your Plan");

      checkPage(130);

      const rationaleLines = selectedPlan.rationale
        ? doc.splitTextToSize(
            selectedPlan.rationale,
            contentWidth - 36
          )
        : [];

      const planHeight =
        72 + rationaleLines.length * 14;

      roundedBox(
        margin,
        y,
        contentWidth,
        planHeight,
        lightPurple
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...darkPurple);

      doc.text(
        selectedPlan.name || "Selected Plan",
        margin + 18,
        y + 25
      );

      if (typeof selectedPlan.score === "number") {
        const scoreText = `${Math.round(
          selectedPlan.score * 100
        )}%`;

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

        doc.text(
          scoreText,
          margin + contentWidth - 44,
          y + 29,
          {
            align: "center",
          }
        );
      }

      let planY = y + 48;

      if (selectedPlan.rationale) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...gray);

        doc.text(
          "RATIONALE",
          margin + 18,
          planY
        );

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

      y += planHeight + 28;
    }

    // =========================
    // Course History
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
    // Notes
    // =========================

    if (notes.length > 0) {
      addSectionTitle("Additional Note");

      checkPage(50);

      const note =
        "All generated schedules are suggestions by AI. There can be mistakes so please double-check results.";

      const lines = doc.splitTextToSize(
        note,
        contentWidth - 20
      );

      checkPage(lines.length * 14 + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...dark);

      doc.text(
        lines,
        margin + 10,
        y
      );

      y += lines.length * 14 + 14;
    }

    y += 10;

    // =========================
    // Recommended Schedule
    // =========================

    addSectionTitle("Recommended Schedule");

    schedule.forEach((semester) => {
      const courses = Array.isArray(semester.courses)
        ? semester.courses
        : [];

      checkPage(85);

      roundedBox(
        margin,
        y,
        contentWidth,
        48,
        purple
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...white);

      doc.text(
        formatTerm(semester.term),
        margin + 16,
        y + 22
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(
        `${semester.credits ?? 0} Total Credits`,
        margin + 16,
        y + 37
      );

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
          ? doc.splitTextToSize(
              course.rationale,
              contentWidth - 36
            )
          : [];

        const cardHeight =
          70 + rationaleLines.length * 13;

        checkPage(cardHeight + 10);

        roundedBox(
          margin,
          y,
          contentWidth,
          cardHeight,
          [250, 249, 251]
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...purple);

        doc.text(
          course.course || "",
          margin + 16,
          y + 19
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...dark);

        doc.text(
          course.name || "Unnamed Course",
          margin + 16,
          y + 38
        );

        const creditText = `${course.credits ?? 0} Credits`;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        const creditWidth =
          doc.getTextWidth(creditText) + 18;

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

        doc.text(
          creditText,
          margin + contentWidth - creditWidth - 6,
          y + 27
        );

        if (course.rationale) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...gray);

          doc.text(
            "WHY THIS COURSE",
            margin + 16,
            y + 57
          );

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
    // Footers
    // =========================

    const totalPages =
      doc.internal.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);

      doc.setDrawColor(...lightGray);

      doc.line(
        margin,
        pageHeight - 40,
        pageWidth - margin,
        pageHeight - 40
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...gray);

      doc.text(
        `${userData?.name || "Student"} • Academic Schedule`,
        margin,
        pageHeight - 25
      );

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
    // Download
    // =========================

    const safeName = (
      userData?.name || "Student"
    )
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_");

    doc.save(
      `${safeName}_Academic_Schedule.pdf`
    );
  } catch (err) {
    console.error("PDF generation failed:", err);

    throw err;
  }
};
