import "./UserStyles.css";
import "../Extra/ExtraStyles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";

//add profile picture option!!!!!

function Settings() {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userData.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSave = () => {
    setUserData({ ...userData, name });
    // email/password save stuff here
    setIsEditing(false);
  };

return (
  <div className="gradientBackground">
    <div className="settingsPage">
      <section className="settingsSection">
        <div className="settingsCard">

          <div className="settingsHeader">
            <h1 className="settingsTitle">
              Settings
            </h1>

            {!isEditing ? (
              <button
                className="settingsEditButton"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            ) : (
              <button
                className="settingsEditButton"
                onClick={handleSave}
              >
                Save
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="settingsInfo">
              <div className="settingsItem">
                <p className="settingsLabel">Name</p>
                <p className="settingsValue">
                  {userData.name}
                </p>
              </div>

              <div className="settingsItem">
                <p className="settingsLabel">Email</p>
                <p className="settingsValue">
                  {email || "(none)"}
                </p>
              </div>

              <div className="settingsItem">
                <p className="settingsLabel">Password</p>
                <p className="settingsValue">
                  ********
                </p>
              </div>
            </div>
          ) : (
            <div className="settingsForm">

              <label className="settingsLabel">
                Name
              </label>

              <input
                className="settingsInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="settingsLabel">
                Email
              </label>

              <input
                className="settingsInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="settingsLabel">
                New Password
              </label>

              <input
                className="settingsInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />

            </div>
          )}

          <button
            className="logoutButton"
            onClick={() => navigate("/")}
          >
            Sign Out
          </button>

        </div>
      </section>
    </div>
  </div>
);
}
export default Settings;
