import IAPOBackground from "../../assets/IAPOBackground.jpg";
import "./Settings.css";
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
            </>
          )}

          <div className="buttonContainerCenter">
            <p className="nextButton" onClick={() => navigate("/")}>
              Sign Out?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
