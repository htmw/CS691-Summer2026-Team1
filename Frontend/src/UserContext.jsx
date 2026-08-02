import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getReq } from "./comp/callRequests";

const UserContext = createContext();

const defaultTranscript = {
  data: "",
  name: "",
};

const defaultUserData = {
  email: "",
  name: "",
  degreeLevel: "Undergrad",
  major: "",
  startingSemester: "",
  endingSemester: "",
  credits: "",
  transcript: defaultTranscript,
  chat: "",
  schedule: {},
};

export function UserProvider({ children }) {
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
  });

  const [userData, setUserData] = useState(defaultUserData);

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const sessionChecked = useRef(false);

  const updateSignUpData = (email, password) => {
    setSignUpData({ email, password });
  };

  const updateUserData = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearSignUpData = useCallback(() => {
    setSignUpData({
      email: "",
      password: "",
    });

    setUserData(defaultUserData);
    setLoggedIn(false);

    localStorage.removeItem("transcript");
  }, []);

  const setUserFromResponse = (response) => {
    if (response) {
      const academic = response.academic || {};

      const updatedUser = {
        email: response.email || "",
        name: response.name || "",
        degreeLevel: academic.degreeLevel || "Undergrad",
        major: academic.major || "",
        startingSemester: academic.startingSemester || "",
        endingSemester: academic.endingSemester || "",
        credits: academic.credits || "",
        transcript: response.transcript || defaultTranscript,
        chat: academic.chat || "",
        schedule: response.schedule || {},
      };

      setUserData(updatedUser);

      if (response.transcript) {
        localStorage.setItem("transcript", JSON.stringify(response.transcript));
      }

      setLoggedIn(true);
      return updatedUser;
    }

    setLoggedIn(false);
    return null;
  };

  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    const checkSession = async () => {
      try {
        const response = await getReq("/auth");

        console.log("User session:", response);

        setUserFromResponse(response);
      } catch (error) {
        console.error(error);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <UserContext.Provider
      value={{
        signUpData,
        updateSignUpData,
        clearSignUpData,

        userData,
        setUserData,
        updateUserData,

        loggedIn,
        setLoggedIn,

        loading,

        setUserFromResponse,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
