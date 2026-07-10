import IAPOBackground from "../assets/IAPOBackground.jpg";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="background"
      style={{ backgroundImage: `url(${IAPOBackground})` }}
    >
      <div className="headingContainer">
        <p className="headingTitle">The Intelligent Academic Path Optimizer</p>
      </div>
      <div className="buttonContainer">
        <p className="button" onClick={() => navigate("/signup")}>
          Sign Up
        </p>
        <p className="button" onClick={() => navigate("/login")}>
          Log In
        </p>
      </div>
    </div>
  );
}

export default Home;
