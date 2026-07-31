import "./UserStyles.css";
import "../Extra/ExtraStyles.css";
import { ROUTES } from "../../routes.js";
import { goToNav, RegularLink } from "../../comp/linking"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";

function Settings() {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userData.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSave = () => {
    setUserData({ ...userData, name });
    setIsEditing(false);
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

              <RegularLink href={ROUTES.HOME} className="heroButton logoutButton">
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
