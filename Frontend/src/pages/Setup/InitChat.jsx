import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./InitChat.css";
import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { goToNav, RegularLink } from "../../comp/linking";

function InitChat() {
  const { setUserData, userData, signUpData, loggedIn, loading } = useUser();

  const [chat, setChat] = useState("");
  const [error, setError] = useState("");
  const goTo = goToNav();

  const handleNext = () => {
    if (!chat.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setError("");

    setUserData((prev) => ({
      ...prev,
      chat,
    }));

    // goTo("/transcript");
  };

  useEffect(() => {
    if (loading) return;

    if (loggedIn) {
      goTo("/");
      return;
    }

    if (!signUpData.email || !signUpData.password) {
      goTo("/signup");
    }
  }, [loading, loggedIn, signUpData.email, signUpData.password, goTo]);

  useEffect(() => {
    if (userData) {
      setChat(userData.chat || "");
    }
  }, [userData]);

  if (loading) {
    return null;
  }

  return (
    <div className="getStartedContainer">
      <div
        className="getStartedBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="formCard">
          <p className="formTitle">Tell us some details</p>

          <textarea
            className="typeChatContainer"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="More math focused, no class on Tuesdays, etc."
          />

          {error && <p className="errorMessage">{error}</p>}

          <div className="nextButtonContainer">
            <RegularLink href="/transcript" className="nextButton">
              Back
            </RegularLink>

            <button className="nextButton" onClick={handleNext}>
              Generate Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InitChat;
