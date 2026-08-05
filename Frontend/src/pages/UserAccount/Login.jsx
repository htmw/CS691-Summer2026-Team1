import "./UserStyles.css";
import { ROUTES } from "../../routes.js";
import { useState, useEffect } from "react";

import { useUser } from "../../UserContext";
import { goToNav, RegularLink } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";

function Login() {
  const { loggedIn, updateSignUpData, setUserFromResponse } =
    useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const goTo = goToNav();

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) && // capital letter
      /[0-9]/.test(password) && // number
      /[!@#$%^&*(),.?":{}|<>]/.test(password) // special character
    );
  };

  const handleLogin = async () => {
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidPassword(password)) {
      setError(
        "Password must be at least 8 characters and include a capital letter, a number, and a special character."
      );
      return;
    }

    const loginData = {
      email: email,
      password: password,
    };
    console.log(loginData);
    try {
      const response = await postReq("/signIn", loginData);

      console.log("Login response:", response);

      // Handle backend error response
      if (response.status === 401) {
        setError(response.message || "Invalid Email/Password");
        return;
      }

      // Successful login
      setUserFromResponse(response);
      goTo(ROUTES.SCHEDULECREATE);
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
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
