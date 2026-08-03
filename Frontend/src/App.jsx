import "./App.css";
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
import SignupFlowWatcher from "./comp/signUpWatch.jsx";

function ProtectedRoute({ hasToBeLoggedIn, children }) {
  const { loggedIn, loading } = useUser();
  if(loading) return null;
  
  if (hasToBeLoggedIn && !loggedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (!hasToBeLoggedIn && loggedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}

function Routing() {
  return (
    <main>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />

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

function App() {
  return (
    <Router>
      <SignupFlowWatcher />
      {/* Check if I can remove gradientBackground here */}
      <div className="container gradientBackground">
        <Header />
        <Routing />
      </div>
    </Router>
  );
}

export default App;
