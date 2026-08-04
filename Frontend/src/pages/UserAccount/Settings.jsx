import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./Settings.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";
import { postReq } from "../../comp/callRequests";

function Settings() {
  const navigate = useNavigate();
  const { userData, setUserData, clearSignUpData } = useUser();
  console.log("Settings userData:", userData);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userData.name);
  const [email, setEmail] = useState(userData.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const nameRegex = /^[A-Za-z ]+$/;

  const handleSave = async () => {
    const updates = {};

    if (name !== userData.name) {
      if (!nameRegex.test(name.trim())) {
        alert("Please enter a valid name.");
        return;
      }
      updates.name = name.trim();
    }

    if (email !== userData.email) {
      if (!isValidEmail(email)) {
        alert("Please enter a valid email.");
        return;
      }
      updates.email = email.trim();
    }

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

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updates.email = email.trim();

    try {
      const response = await postReq("/updateUser", updates);

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
      navigate("/");
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  return (
    <div className="midSizeCardContainer">
      <div
        className="centerBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="signupCard">
          <div className="settingsHeader">
            <p className="formTitle">Settings</p>
            {!isEditing ? (
              <p className="settingsEditButton" onClick={() => setIsEditing(true)}>edit</p>
            ) : (
              <p className="settingsEditButton" onClick={handleSave}>save</p>
            )}
          </div>

          {!isEditing ? (
            <>
              <p className="formLabel">Name: {userData.name}</p>
              <p className="formLabel">Email: {email || "(none)"}</p>
              <p className="formLabel">Password: *****</p>
            </>
          ) : (
            <>
              <p className="formLabel">Name</p>
              <input
                className="formInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="formLabel">Email</p>
              <input
                className="formInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="formLabel">New Password</p>
              <input
                className="formInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="*****"
              />
              <p className="formLabel">Confirm Password</p>
              <input
                className="formInput"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="*****"
              />
            </>
          )}

          <div className="buttonContainerCenter">
            <p className="nextButton" onClick={signOut}>
              Sign Out
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
