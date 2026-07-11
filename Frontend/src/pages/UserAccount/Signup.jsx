import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./Signup.css";
import { useState, useEffect } from "react";

import { useUser } from "../../UserContext";
import { goToNav, RegularLink } from "../../comp/linking";
import { postReq } from "../../comp/callRequests";

function Signup() {
  const { loggedIn, loading, updateSignUpData, signUpData, clearSignUpData } =
    useUser();

  const [email, setEmail] = useState(signUpData.email || "");
  const [password, setPassword] = useState(signUpData.password || "");
  const [confirmPassword, setConfirmPassword] = useState(
    signUpData.password || ""
  );
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

  const handleSignup = async () => {
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
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    console.log({ email, password });

    try {
      const response = await postReq("/authEmail", {
        email: email,
      });
      if (response.exists) {
        setError("Email already used.");
        return;
      }
      console.log({ email, password });
      updateSignUpData(email, password);

      goTo("/getstarted");
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    if (!loading && loggedIn) {
      goTo("/");
    }
  }, [loading, loggedIn, goTo]);

  useEffect(() => {
    if (signUpData.email) {
      setEmail(signUpData.email);
    }
    if (signUpData.password) {
      setPassword(signUpData.password);
      setConfirmPassword(signUpData.password);
    }
  }, [signUpData]);

  if (loading) {
    return null;
  }

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

          {error && <p className="signupError">{error}</p>}

          <div className="signupButtonContainer">
            <p className="nextButton" onClick={handleSignup}>
              Sign Up
            </p>
          </div>

          <RegularLink href="/login" className="signupLoginLink">
            Already have an account? Log in
          </RegularLink>
        </div>
      </div>
    </div>
  );
}

export default Signup;
