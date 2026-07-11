import IAPOBackground from "../../assets/IAPOBackground.jpg";
import fileimg from "../../assets/file.png";
import "./Transcript.css";
import { useEffect, useRef, useState } from "react";
import { RegularLink, goToNav } from "../../comp/linking";

import { useUser } from "../../UserContext";

function Transcript() {
  const fileInputRef = useRef(null);

  const { userData, updateUserData, signUpData, loggedIn, loading } = useUser();

  const [error, setError] = useState("");

  const goTo = goToNav();

  useEffect(() => {
    if (loading) return;

    // Already logged in users should not be here
    if (loggedIn) {
      goTo("/");
      return;
    }

    // User skipped signup
    if (!signUpData.email || !signUpData.password) {
      goTo("/signup");
      return;
    }

    // User completed signup but skipped GetStarted
    if (!userData.name) {
      goTo("/getstarted");
    }
  }, [
    loading,
    loggedIn,
    signUpData.email,
    signUpData.password,
    userData.name,
    goTo,
  ]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    event.target.value = "";

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
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

  if (loading) {
    return null;
  }

  return (
    <div className="getStartedContainer">
      <div
        className="getStartedBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="formCardCenter">
          <p className="formTitle">Upload an optional transcript</p>

          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <div
            className="transcriptContainer"
            onClick={() => fileInputRef.current.click()}
          >
            <img src={fileimg} alt="file pic" className="fileimg" />

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

          {error && <p className="errorText">{error}</p>}

          <div className="nextButtonContainer">
            <RegularLink href="/getstarted" className="nextButton">
              Back
            </RegularLink>
            <RegularLink href="/initchat" className="nextButton">
              Next
            </RegularLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transcript;
