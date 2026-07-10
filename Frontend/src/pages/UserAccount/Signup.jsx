import IAPOBackground from "../assets/IAPOBackground.jpg";
import "./Signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log({ email, password });
    // put signup logic here
    navigate("/getstarted");
  };

  return (
    <div className="signupContainer">
      <div
        className="signupBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="signupCard">
          <p className="formTitle">Sign Up</p>

          <p className="formLabel">Email</p>
          <input
            className="formInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />

          <p className="formLabel">Password</p>
          <input
            className="formInput"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />

          <p className="formLabel">Confirm Password</p>
          <input
            className="formInput"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />

          <div className="signupButtonContainer">
            <p className="nextButton" onClick={handleSignup}>
              Sign Up
            </p>
          </div>

          <p className="signupLoginLink" onClick={() => navigate("/login")}>
            Already have an account? Log in
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
