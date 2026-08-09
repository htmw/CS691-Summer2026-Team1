import "./ScheduleCreator.css";
import { ROUTES } from "../../routes.js";

import { useState, useRef, useEffect } from "react";
import { useUser } from "../../UserContext";
import { postReq, getReq } from "../../comp/callRequests";
import { goToNav } from "../../comp/linking";

function ScheduleLoader({ onReady }) {
  const { scheduleRequest, pendingLogin, setPendingLogin, setLoggedIn } =
    useUser();
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: "Analyzing your availability...",
      exiting: false,
    },
  ]);

  const [finished, setFinished] = useState(false);
  const messageId = useRef(1);
  const goTo = goToNav();
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;

    console.log(scheduleRequest);

    if (!scheduleRequest) {
      goTo(ROUTES.SCHEDULECREATE);
      return;
    }

    const generateSchedule = async () => {
      try {
        console.log("Best");

        const responseB = await getReq("/api/health");
        console.log(responseB);

        const responseA = await postReq("/api/extract", scheduleRequest);
        console.log(responseA);

        if (pendingLogin) {
          setLoggedIn(true);
          setPendingLogin(false);
        }
      } catch (err) {
        console.error("Schedule generation failed:", err);
      }
    };

    generateSchedule();
  }, [scheduleRequest, pendingLogin, setLoggedIn, setPendingLogin, goTo]);

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
