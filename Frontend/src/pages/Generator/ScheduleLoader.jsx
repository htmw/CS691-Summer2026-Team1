import "./ScheduleCreator.css";
import { ROUTES } from "../../routes.js";

import { useState, useRef, useEffect } from "react";
import { useUser } from "../../UserContext";
import { postReq, getReq } from "../../comp/callRequests";
import { goToNav } from "../../comp/linking";

function ScheduleLoader({ onReady }) {
  const {
    scheduleRequest,
    userData,
    setUserFromResponse,
    pendingLogin,
    setPendingLogin,
    setLoggedIn,
  } = useUser();

  const [messages, setMessages] = useState([]);
  const [finished, setFinished] = useState(false);

  const messageId = useRef(1);

  const goTo = goToNav();

  // Keep the latest functions available without making the generation
  // effect restart whenever their identity changes.
  const goToRef = useRef(goTo);
  const updateAllUserDataRef = useRef(setUserFromResponse);
  const setLoggedInRef = useRef(setLoggedIn);
  const setPendingLoginRef = useRef(setPendingLogin);

  useEffect(() => {
    goToRef.current = goTo;
  }, [goTo]);

  useEffect(() => {
    updateAllUserDataRef.current = setUserFromResponse;
  }, [setUserFromResponse]);

  useEffect(() => {
    setLoggedInRef.current = setLoggedIn;
  }, [setLoggedIn]);

  useEffect(() => {
    setPendingLoginRef.current = setPendingLogin;
  }, [setPendingLogin]);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  useEffect(() => {
    if (!scheduleRequest) {
      goToRef.current(ROUTES.SCHEDULECREATE);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    let cancelled = false;

    const request = scheduleRequest;
    const email = userData.email;
    const shouldLogin = pendingLogin;

    const checkCancelled = () => {
      if (cancelled || signal.aborted) {
        throw new DOMException("Operation cancelled", "AbortError");
      }
    };

    const safeDelay = async (ms) => {
      await delay(ms);
      checkCancelled();
    };

    const generateSchedule = async () => {
      try {
        // --------------------------------
        // Step 1: Health check
        // --------------------------------
        iterateText("Checking our scheduling service...");
        await safeDelay(1600);

        checkCancelled();

        // Message appears BEFORE the request
        const responseB = await getReq("/api/health", {
          signal,
        });

        console.log(responseB);

        checkCancelled();

        // --------------------------------
        // Step 2: Extract schedule
        // --------------------------------

        await safeDelay(800);

        checkCancelled();
        iterateText("Building your schedule...");

        // Message appears BEFORE the request
        const responseA = await postReq("/api/extract", request, { signal });

        console.log(responseA);

        checkCancelled();

        // --------------------------------
        // Step 3: Update user
        // --------------------------------

        await safeDelay(1600);

        const updatedScheduleRequest = {
          ...request,
          email,
          schedule: responseA,
        };

        checkCancelled();
        iterateText("Saving your schedule...", true);

        // Message appears BEFORE the request
        const responseC = await postReq(
          "/updateUser/academic",
          updatedScheduleRequest,
          { signal }
        );

        console.log(responseC);

        checkCancelled();

        updateAllUserDataRef.current(responseC);

        if (shouldLogin) {
          setLoggedInRef.current(true);
          setPendingLoginRef.current(false);
        }

        await safeDelay(800);

        goToRef.current(ROUTES.SCHEDULECREATE);
      } catch (err) {
        if (cancelled || signal.aborted || err?.name === "AbortError") {
          return;
        }

        console.error("Schedule generation failed:", err);

        const errorText =
          err.response?.data?.detail || "Unable to update your account.";

        if (cancelled || signal.aborted) {
          return;
        }

        iterateText(errorText, true);

        await delay(2500);

        if (!cancelled && !signal.aborted) {
          goToRef.current(ROUTES.SCHEDULECREATE);
        }
      }
    };

    generateSchedule();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [scheduleRequest]);

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
