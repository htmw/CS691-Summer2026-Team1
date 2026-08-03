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
    const updates = {};

    // Name
    if (name !== userData.name) {
      if (!nameRegex.test(name.trim())) {
        alert("Please enter a valid name.");
        return;
      }

      updates.name = name.trim();
    }

    // Email
    if (email !== userData.email) {
      if (!isValidEmail(email)) {
        alert("Please enter a valid email.");
        return;
      }

      updates.email = email.trim();
    }

    // Password (only if user entered one)
    if (password !== "") {
      if (!isValidPassword(password)) {
        alert(
          "Password must be at least 8 characters and contain an uppercase letter, number, and special character."
        );
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      updates.password = password;
    }

    // Nothing changed
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updates.email = email.trim();

    try {
      response = await postReq("/updateUser", updates);

      setUserData((prev) => ({
        ...prev,
        ...updates,
      }));

      setPassword("");
      setConfirmPassword("");
      setIsEditing(false);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Unable to update your account.");
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
