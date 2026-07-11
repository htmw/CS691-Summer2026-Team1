import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../UserContext";
import { ROUTES } from "../routes";

export default function SignupFlowWatcher() {
  const location = useLocation();
  const { clearSignUpData } = useUser();

  const previousPath = useRef(location.pathname);

  useEffect(() => {
    const signupFlow = ["/signup", "/getstarted", "/transcript", "/initchat"];

    const wasInSignupFlow = signupFlow.includes(previousPath.current);
    const isInSignupFlow = signupFlow.includes(location.pathname);

    if (wasInSignupFlow && !isInSignupFlow) {
      clearSignUpData();
    }

    previousPath.current = location.pathname;
  }, [location.pathname, clearSignUpData]);

  return null;
}
