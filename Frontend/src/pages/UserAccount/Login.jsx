import "./UserStyles.css";
import { ROUTES } from "../../routes.js";
import { useState, useEffect } from "react";
import { goToNav, RegularLink } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const goTo = goToNav();

  const handleLogin = () => {
    console.log({ email, password });
    goTo(ROUTES.SCHEDULECREATE);
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

          {error && <p className="errorMessage">{error}</p>}

          <div className="buttonContainerCenter">
            <p className="heroButton nextButton" onClick={handleLogin}>
              Log In
            </p>
          </div>

          <RegularLink href={ROUTES.SIGNUP} className="authLink">
            Don't have an account? Sign up
          </RegularLink>
        </div>
      </div>
    </div>
  );
}

export default Login;
