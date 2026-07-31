import "./ScheduleCreator.css";
import { useState, useRef, useEffect } from "react";

function ScheduleLoader({ onReady }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: "Analyzing your availability...",
      exiting: false,
    },
  ]);

  const [finished, setFinished] = useState(false);
  const messageId = useRef(1);

  const iterateText = (text, isLast = false) => {
    const id = messageId.current++;

    setMessages((prev) => [
      ...prev.map((msg) => ({
        ...msg,
        exiting: true,
      })),
      {
        id,
        text,
        exiting: false,
      },
    ]);

    if (isLast) {
      setFinished(true);
    }
  };

  // Expose the function to the parent component
  useEffect(() => {
    if (onReady) {
      onReady(iterateText);
    }
  }, [onReady]);

  return (
    <div className="gradientBackground scheduleCreatorPage">
      <div className="landingOverlay">
        <div className={`scheduleLoader ${finished ? "finished" : ""}`}>
          <div className="spinner" />

          <div className="loaderTextContainer">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`loaderText ${msg.exiting ? "fadeOutUp" : "fadeIn"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleLoader;
