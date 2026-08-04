import "./UserStyles.css";
import "../Extra/ExtraStyles.css";
import { ROUTES } from "../../routes.js";
import { useState, useEffect } from "react";
import { goToNav, RegularLink } from "../../comp/linking";

import { useUser } from "../../UserContext";
import { postReq } from "../../comp/callRequests";

function Settings() {
  const { loggedIn, setUserData, clearSignUpData, userData } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userData.name);
  const [email, setEmail] = useState(userData.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

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

  const nameRegex = /^[A-Za-z ]+$/;

  const handleSave = async () => {
    setError("");
    const updates = {};

    if (name !== userData.name) {
      if (!nameRegex.test(name.trim())) {
        setError("Please enter a valid name.");
        return;
      }

      updates.name = name.trim();
    }

    if (email !== userData.email) {
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      updates.email = email.trim();
    }

    if (password !== "") {
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

      updates.password = password;
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await postReq("/updateUser", updates);

      setUserData(response);

      setError("");

      setPassword("");
      setConfirmPassword("");
      setIsEditing(false);
    } catch (err) {
      console.log(err);
      console.log(err.response);
      console.log(err.response?.data);

      setError(err.response?.data?.detail || "Unable to update your account.");
    }
  };

  const signOut = async () => {
    try {
      const response = await postReq("/signOut", {});
      clearSignUpData();
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <div className="authCard">
          <div className="settingsHeader">
            <h1 className="formTitle">Settings</h1>

            <button
              className="heroButton primaryButton settingsSaveButton"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            >
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>

          {!isEditing ? (
            <div className="settingsInfo">
              <div className="settingsItem">
                <p className="formLabel">Name</p>
                <p className="settingsValue">{userData.name}</p>
              </div>

              <div className="settingsItem">
                <p className="formLabel">Email</p>
                <p className="settingsValue">{email || "(none)"}</p>
              </div>

              <RegularLink
                href={ROUTES.HOME}
                className="heroButton logoutButton"
                onClick={signOut}
              >
                Sign Out
              </RegularLink>
            </div>
          ) : (
            <form className="settingsForm">
              <label className="formLabel">Name</label>
              <input
                className="formInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="formLabel">Email</label>
              <input
                className="formInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="formLabel">New Password</label>
              <input
                className="formInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />

              <label className="formLabel">Confirm Password</label>
              <input
                className="formInput"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />

              {error && <p className="errorMessage">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
