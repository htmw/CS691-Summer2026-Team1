import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { getReq } from "./comp/callRequests";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
  });

  const [userData, setUserData] = useState({
    name: "",
    degreeLevel: "Undergrad",
    major: "",
    startingSemester: "",
    endingSemester: "",
    credits: "",
    transcript: {
      data: "",
      name: "",
    },
    chat: "",
  });

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const sessionChecked = useRef(false);

  const updateSignUpData = (email, password) => {
    setSignUpData({
      email,
      password,
    });
  };

  const updateUserData = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const savedTranscript = localStorage.getItem("transcript");

    if (savedTranscript) {
      setUserData((prev) => ({
        ...prev,
        transcript: savedTranscript,
      }));
    }
  }, []);

  useEffect(() => {
    if (userData.transcript) {
      localStorage.setItem("transcript", userData.transcript);
    } else {
      localStorage.removeItem("transcript");
    }
  }, [userData.transcript]);

  const clearSignUpData = useCallback(() => {
    setSignUpData({
      email: "",
      password: "",
    });

    setUserData({
      name: "",
      degreeLevel: "Undergrad",
      major: "",
      startingSemester: "",
      endingSemester: "",
      credits: "",
      transcript: {
        data: "",
        name: "",
      },
      chat: "",
    });

    localStorage.removeItem("transcript");
  }, []);

  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    async function checkSession() {
      try {
        const response = await getReq("/auth");

        if (response.user) {
          setUserData({
            name: response.user.name || "",
            degreeLevel: response.user.degreeLevel || "Undergrad",
            major: response.user.major || "",
            startingSemester: response.user.startingSemester || "",
            endingSemester: response.user.endingSemester || "",
            credits: response.user.credits || "",
            transcript: response.user.transcript || { data: "", name: "" },
            chat: "",
          });

          setLoggedIn(true);
        }
      } catch (error) {
        console.log("Invalid Session");
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }

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
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
