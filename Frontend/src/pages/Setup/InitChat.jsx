import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./InitChat.css";
import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { goToNav, RegularLink } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";

function InitChat() {
  const { setUserData, userData, signUpData, loggedIn, loading } = useUser();

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
      ...signUpData,
      ...userData,
      chat,
    };

    setUserData(updatedUserData);

    // goTo("/transcript");
    try {
      const response = await postReq("/signUp", updatedUserData);
      console.log("Plan generated:", response);
      setError("Account Created");
      //goTo("/getstarted");
    } catch (error) {
      console.error(error.response?.data || error);
      setError("Something went wrong. Please try again.");
    }
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
