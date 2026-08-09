import "./SetupStyles.css";
import { ROUTES } from "../../routes.js";
import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { goToNav, RegularLink } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";

function InitChat() {
  const {
    setUserData,
    userData,
    signUpData,
    setPendingLogin,
    setUserFromResponse,
    setScheduleRequest,
  } = useUser();

  const [chat, setChat] = useState("");
  const [error, setError] = useState("");
  const goTo = goToNav();

  const handleNext = async () => {
    if (!chat.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setError("");

    const updatedUserData = {
      ...userData,
      ...signUpData,
      chat,
    };

    setUserData(updatedUserData);

    try {
      const response = await postReq("/signUp", updatedUserData);

      setUserFromResponse(response, false);

      setScheduleRequest({
        degreeLevel: updatedUserData.degreeLevel,
        major: updatedUserData.major,
        startingSemester: updatedUserData.startingSemester,
        endingSemester: updatedUserData.endingSemester,
        credits: updatedUserData.credits,
        transcript: updatedUserData.transcript,
        chat: updatedUserData.chat,
      });

      setPendingLogin(true);

      goTo(ROUTES.SCHEDULELOAD);
    } catch (error) {
      console.error(error.response?.data || error);
      setError("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    if (!signUpData.email || !signUpData.password) {
      goTo(ROUTES.SIGNUP);
      return;
    }
  }, [signUpData.email, signUpData.password, goTo]);

  useEffect(() => {
    if (userData) {
      setChat(userData.chat || "");
    }
  }, [userData]);

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <div className="authCard detailsCard">
          <div className="setupContent">
            <h1 className="formTitle">Tell us some details</h1>

            <div className="formGroup">
              <textarea
                className="detailsTextarea"
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                placeholder="More math focused, no class on Tuesdays, etc."
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <div className="formActions">
              <RegularLink
                href={ROUTES.TRANSCRIPT}
                className="heroButton nextButton"
              >
                Back
              </RegularLink>

              <button className="heroButton nextButton" onClick={handleNext}>
                Generate Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InitChat;
