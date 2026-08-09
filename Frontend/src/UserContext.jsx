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

const defaultProgramInfo = {
  semesters: [],
  majors: [],
};

export function UserProvider({ children }) {
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
  });

  const [authChecked, setAuthChecked] = useState(false);
  const [programInfo, setProgramInfo] = useState(defaultProgramInfo);
  const [userData, setUserData] = useState(defaultUserData);

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);

  const sessionChecked = useRef(false);

  const [scheduleRequest, setScheduleRequest] = useState(null);

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

  const setUserFromResponse = (response, shouldLogin = true) => {
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

      if (shouldLogin) {
        setLoggedIn(true);
      }
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
        setAuthChecked(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (authChecked) {
      setLoading(false);
    }
  }, [authChecked]);

  const programChecked = useRef(false);

  useEffect(() => {
    if (programChecked.current) return;
    programChecked.current = true;

    const loadProgramInfo = async () => {
      try {
        const response = await getReq("/api/info");

        console.log("Program info:", response);

        setProgramInfo({
          semesters: response.semesters || [],
          majors: response.majors || [],
        });
      } catch (error) {
        console.error("Failed to load program info:", error);
      }
    };

    loadProgramInfo();
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

        programInfo,

        loggedIn,
        setLoggedIn,
        pendingLogin,
        setPendingLogin,

        loading,
        authChecked,
        setUserFromResponse,

        scheduleRequest,
        setScheduleRequest,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
