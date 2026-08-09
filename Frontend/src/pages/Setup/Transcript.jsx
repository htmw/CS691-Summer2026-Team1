import "./SetupStyles.css";
import { ROUTES } from "../../routes.js";
import fileimg from "/assets/file.png";
import { useEffect, useRef, useState } from "react";
import { RegularLink, goToNav } from "../../comp/linking";

import { useUser } from "../../UserContext";
import { postReq } from "../../comp/callRequests";

function Transcript() {
  const fileInputRef = useRef(null);

  const { userData, updateUserData, signUpData } = useUser();

  const [error, setError] = useState("");
  const [isCheckingTranscript, setIsCheckingTranscript] = useState(false);
  const [transcriptInvalid, setTranscriptInvalid] = useState(false);

  const goTo = goToNav();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Allows the same file to be selected again later
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
    setTranscriptInvalid(false);
    setIsCheckingTranscript(true);

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
      });

      // Keep the file visible while it is being checked
      updateUserData("transcript", {
        data: dataUrl,
        name: file.name,
      });

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
    updateUserData("transcript", {
      data: "",
      name: "",
    });

    setTranscriptInvalid(false);
    setError("");
  };

  const hasTranscript = Boolean(userData.transcript?.data);

  // Buttons are disabled only while checking or when
  // a transcript has been determined to be invalid.
  const buttonsDisabled =
    isCheckingTranscript || transcriptInvalid;

  const handleDisabledLink = (event) => {
    if (buttonsDisabled) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    // User skipped signup
    if (!signUpData.email || !signUpData.password) {
      goTo(ROUTES.SIGNUP);
      return;
    }

    // User completed signup but skipped GetStarted
    if (!userData.name) {
      goTo(ROUTES.GETSTARTED);
      return;
    }
  }, [
    signUpData.email,
    signUpData.password,
    userData.name,
    goTo,
  ]);

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <div className="authCard transcriptCard">
          <div className="setupContent">
            <h1 className="formTitle">
              Upload an optional transcript
            </h1>

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

                  <p className="uploadText">
                    Checking transcript...
                  </p>

                  <p className="transcriptCheckingText">
                    Please wait
                  </p>
                </>
              ) : (
                <>
                  <img
                    src={fileimg}
                    alt="file upload"
                    className="fileimg"
                  />

                  {hasTranscript ? (
                    <>
                      <p className="uploadText">
                        {userData.transcript.name}
                      </p>

                      {transcriptInvalid && (
                        <p className="transcriptInvalidText">
                          Invalid transcript
                        </p>
                      )}

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
                    <p className="uploadText">
                      Click to upload your PDF
                    </p>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="errorMessage">
                {error}
              </div>
            )}

            <div className="formActions">
              <RegularLink
                href={ROUTES.GETSTARTED}
                className={`heroButton nextButton ${
                  buttonsDisabled ? "disabledButton" : ""
                }`}
                onClick={handleDisabledLink}
                aria-disabled={buttonsDisabled}
              >
                Back
              </RegularLink>

              <RegularLink
                href={ROUTES.INITCHAT}
                className={`heroButton nextButton ${
                  buttonsDisabled ? "disabledButton" : ""
                }`}
                onClick={handleDisabledLink}
                aria-disabled={buttonsDisabled}
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
