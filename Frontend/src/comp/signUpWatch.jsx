import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../UserContext";
import { ROUTES } from "../routes";

export default function SignupFlowWatcher() {
  const location = useLocation();
  const { clearSignUpData, loggedIn} = useUser();

  const previousPath = useRef(location.pathname);

  useEffect(() => {
    const signupFlow = [
      ROUTES.SIGNUP,
      ROUTES.GETSTARTED,
      ROUTES.TRANSCRIPT,
      ROUTES.INITCHAT,
    ];

    const wasInSignupFlow = signupFlow.includes(previousPath.current);
    const isInSignupFlow = signupFlow.includes(location.pathname);

    if (wasInSignupFlow && !isInSignupFlow && !loggedIn) {
      clearSignUpData();
    }

    previousPath.current = location.pathname;
  }, [location.pathname, clearSignUpData]);

  return null;
}
