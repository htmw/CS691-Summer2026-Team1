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

//Local stored info
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
  //For the sign up flow
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
  });

  const [userData, setUserData] = useState(defaultUserData);
  const [scheduleRequest, setScheduleRequest] = useState(null);
  const [programInfo, setProgramInfo] = useState(defaultProgramInfo);

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const sessionChecked = useRef(false);
  const programChecked = useRef(false);

  //Sets user info from backend. ShouldLogin is only for sign up flow as a work around
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

  //Update individual fields
  const updateUserData = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  //Keeps it until the user actually creates an account
  const updateSignUpData = (email, password) => {
    setSignUpData({ email, password });
  };

  //When the user leaves the sign up flow
  const clearSignUpData = useCallback(() => {
    setSignUpData({
      email: "",
      password: "",
    });

    setUserData(defaultUserData);
    setLoggedIn(false);

    localStorage.removeItem("transcript");
  }, []);

  //Session authentication
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    const checkSession = async () => {
      try {
        const response = await getReq("/auth");
        setUserFromResponse(response);
      } catch (error) {
        setLoggedIn(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkSession();
  }, []);

  //Once the auth check is done, load the full site
  useEffect(() => {
    if (authChecked) {
      setLoading(false);
    }
  }, [authChecked]);

  //Gets the basic program info for the schedule generator
  useEffect(() => {
    if (programChecked.current) return;
    programChecked.current = true;

    const loadProgramInfo = async () => {
      try {
        const response = await getReq("/api/info");

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

  //Expose the consts for the other files
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
