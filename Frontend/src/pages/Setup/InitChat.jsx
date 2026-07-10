import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./InitChat.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function InitChat() {
  const [chat, setChat] = useState("");
  const navigate = useNavigate();
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
          <div className="nextButtonContainer">
            <button
              className="nextButton"
              onClick={() => navigate("/schedulecreator")}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InitChat;
