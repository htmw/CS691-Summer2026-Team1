import "./SetupStyles.css";
import { ROUTES } from "../../routes.js";
import fileimg from "/assets/file.png";
import { useEffect, useRef, useState } from "react";
import { RegularLink, goToNav } from "../../comp/linking";

import { useUser } from "../../UserContext";

function Transcript() {
  const fileInputRef = useRef(null);

  const { userData, updateUserData, signUpData, loggedIn, loading } = useUser();

  const [error, setError] = useState("");

  const goTo = goToNav();

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

  useEffect(() => {
    if (loading) return;

    // User skipped signup
    if (!signUpData.email || !signUpData.password) {
      goTo(ROUTES.SIGNUP);
      return;
    }

    // User completed signup but skipped GetStarted
    if (!userData.name) {
      goTo(ROUTES.GETSTARTED);
    }
  }, [
    loading,
    loggedIn,
    signUpData.email,
    signUpData.password,
    userData.name,
    goTo,
  ]);

  if (loading) {
    return null;
  }

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <div className="authCard transcriptCard">
          <div className="setupContent">
            <h1 className="formTitle">Upload an optional transcript</h1>

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
              <img src={fileimg} alt="file upload" className="fileimg" />

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

            <div className="formActions">
              <RegularLink
                href={ROUTES.GETSTARTED}
                className="heroButton nextButton"
              >
                Back
              </RegularLink>

              <RegularLink
                href={ROUTES.INITCHAT}
                className="heroButton nextButton"
              >
                Next
              </RegularLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transcript;
