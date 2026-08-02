import { useState, useEffect } from "react"; // 1. Added React Hooks here!
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./comp/header.jsx";

import Home from "./pages/Extra/Home.jsx";
import Contact from "./pages/Extra/Contact.jsx";

import ScheduleCreator from "./pages/Generator/ScheduleCreator.jsx";
import ScheduleLoader from "./pages/Generator/ScheduleLoader.jsx";

import GetStarted from "./pages/Setup/GetStarted.jsx";
import InitChat from "./pages/Setup/InitChat.jsx";
import Transcript from "./pages/Setup/Transcript.jsx";

import Login from "./pages/UserAccount/Login.jsx";
import Signup from "./pages/UserAccount/Signup.jsx";
import Settings from "./pages/UserAccount/Settings.jsx";
import { useUser } from "./UserContext.jsx";
import { ROUTES } from "./routes.js";
import "./App.css";
import SignupFlowWatcher from "./comp/signUpWatch.jsx";

function ProtectedRoute({ children }) {
  const { loggedIn } = useUser();

  if (!loggedIn) {
    //return <Navigate to="/gettingStarted" replace />;
  }

  return children;
}

function Routing() {
  return (
    <main>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />

        <Route path={ROUTES.GETSTARTED} element={
          <ProtectedRoute><GetStarted /></ProtectedRoute>
        } />
        <Route path={ROUTES.TRANSCRIPT} element={
          <ProtectedRoute><Transcript /></ProtectedRoute>
        } />
        <Route path={ROUTES.INITCHAT} element={
          <ProtectedRoute><InitChat /></ProtectedRoute>
        } />

        <Route path={ROUTES.SCHEDULECREATE} element={
          <ProtectedRoute><ScheduleCreator /></ProtectedRoute>
        } />
        <Route path={ROUTES.SCHEDULELOAD} element={
          <ProtectedRoute><ScheduleLoader /></ProtectedRoute>
        } />

        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SETTINGS} element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </main>
  );
}

function App() {
  // 2. Added Dark Mode State & LocalStorage Logic
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <Router>
      <SignupFlowWatcher />

      <div className="container gradientBackground">
        {/* 3. Passed the props down to your Header! */}
        <Header toggleTheme={toggleTheme} isDark={isDark} />
        <Routing />
      </div>
    </Router>
  );
}

export default App;