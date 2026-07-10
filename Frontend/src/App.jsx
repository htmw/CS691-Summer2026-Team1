import "./App.css";
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

function Routing() {
  const navigate = useNavigate();

  return (
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/getstarted" element={<GetStarted />} />
        <Route path="/transcript" element={<Transcript />} />
        <Route path="/initchat" element={<InitChat />} />
        <Route path="/schedulecreator" element={<ScheduleCreator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
