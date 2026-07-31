

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log({ email, password });
    navigate("/schedulecreator");
  };


return (
  <div className="gradientBackground">
    <div className="landingOverlay">
      <div className="authCard">
        <p className="formTitle">Log In</p>

        <label className="formLabel">Email</label>
        <input
          className="formInput"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />

        <label className="formLabel">Password</label>
        <input
          className="formInput"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />

        <div className="buttonContainerCenter">
          <p className="heroButton nextButton" >
            Log In
          </p>
        </div>

        <p
          className="authLink"
          onClick={() => navigate("/signup")}
        >
          Don't have an account? Sign up
        </p>
      </div>
    </div>
  </div>
);
}

export default Login;
