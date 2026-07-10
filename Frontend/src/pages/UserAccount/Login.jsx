import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log({ email, password });
    navigate("/getstarted");
  };

  return (
    <div className="loginContainer">
      <div
        className="loginBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="loginCard">
          <p className="formTitle">Log In</p>

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
            placeholder="Your password"
          />

          <div className="loginButtonContainer">
            <p className="nextButton" onClick={handleLogin}>
              Log In
            </p>
          </div>

          <p className="loginSignupLink" onClick={() => navigate("/signup")}>
            Don't have an account? Sign up
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
