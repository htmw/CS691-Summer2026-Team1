import "./App.css";
import { useState, useEffect } from "react"; // 1. Added React Hooks here!
import { useUser } from "./UserContext.jsx";
import { ROUTES } from "./routes.js";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Header from "./comp/header.jsx";

import Home from "./pages/Extra/Home.jsx";
import Contact from "./pages/Extra/Contact.jsx";

import ScheduleCreator from "./pages/Generator/ScheduleCreator.jsx";
import ScheduleLoader from "./pages/Generator/ScheduleLoader.jsx";

import SignupFlowWatcher from "./comp/signUpWatch.jsx";
import GetStarted from "./pages/Setup/GetStarted.jsx";
import InitChat from "./pages/Setup/InitChat.jsx";
import Transcript from "./pages/Setup/Transcript.jsx";

import Login from "./pages/UserAccount/Login.jsx";
import Signup from "./pages/UserAccount/Signup.jsx";
import Settings from "./pages/UserAccount/Settings.jsx";

//Ensures proper authentication to go to these sites
function ProtectedRoute({ hasToBeLoggedIn, children }) {
  const { loggedIn, loading, userData, pendingLogin } = useUser();
  const location = useLocation();

  if (loading) return null;

  //If not signed in and you enter a link that requires you to be signed in
  if (
    hasToBeLoggedIn === true &&
    !loggedIn &&
    !pendingLogin &&
    location.pathname !== ROUTES.SCHEDULELOAD
  ) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  //If signed in and you enter a link that requires you to not be signed in
  if (hasToBeLoggedIn === false && loggedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}

function Routing() {
  return (
    <main>
      <Routes>
        <Route
          path={ROUTES.HOME}
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.CONTACT}
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.GETSTARTED}
          element={
            <ProtectedRoute hasToBeLoggedIn={false}>
              <GetStarted />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TRANSCRIPT}
          element={
            <ProtectedRoute hasToBeLoggedIn={false}>
              <Transcript />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.INITCHAT}
          element={
            <ProtectedRoute hasToBeLoggedIn={false}>
              <InitChat />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SCHEDULECREATE}
          element={
            <ProtectedRoute hasToBeLoggedIn={true}>
              <ScheduleCreator />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SCHEDULELOAD}
          element={
            <ProtectedRoute hasToBeLoggedIn={true}>
              <ScheduleLoader />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SIGNUP}
          element={
            <ProtectedRoute hasToBeLoggedIn={false}>
              <Signup />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.LOGIN}
          element={
            <ProtectedRoute hasToBeLoggedIn={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute hasToBeLoggedIn={true}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="loadingScreen">
      <div className="loadingContent">
        <div className="loadingSpinner" />
        <p>Loading your workspace...</p>
      </div>
    </div>
  );
}

function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="pageTransition">
      {children}
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  //Dark mode
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const hideHeader = location.pathname === ROUTES.SCHEDULELOAD;

  return (
    <>
      <SignupFlowWatcher />

      <div className="container gradientBackground">
        {!hideHeader && <Header toggleTheme={toggleTheme} isDark={isDark} />}

        <PageTransition>
          <Routing />
        </PageTransition>
      </div>
    </>
  );
}

function App() {
  const { loading } = useUser();

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <Router basename="/intelligent-academic-path-optimizer">
      <AppContent />
    </Router>
  );
}

export default App;
