import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./comp/header.jsx";

import Home from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";
import ScheduleCreator from "./pages/ScheduleCreator.jsx";

import GetStarted from "./pages/Setup/GetStarted.jsx";
import InitChat from "./pages/Setup/InitChat.jsx";
import Transcript from "./pages/Setup/Transcript.jsx";

import Login from "./pages/UserAccount/Login.jsx";
import Signup from "./pages/UserAccount/Signup.jsx";
import Settings from "./pages/UserAccount/Settings.jsx";

import { ROUTES } from "./routes.js";

import "./App.css";

function Routing() {
  return (
    <main>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />

        <Route path={ROUTES.GETSTARTED} element={<GetStarted />} />
        <Route path={ROUTES.TRANSCRIPT} element={<Transcript />} />
        <Route path={ROUTES.INITCHAT} element={<InitChat />} />

        <Route path={ROUTES.SCHEDULECREATE} element={<ScheduleCreator />} />

        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="container">
        <Header />
        <Routing />
      </div>
    </Router>
  );
}

export default App;
