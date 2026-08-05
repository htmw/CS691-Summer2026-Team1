import "./compStyles.css";
import { ROUTES } from "../routes.js";
import { RegularLink } from "./linking";

import { useUser } from "../UserContext";
import logoImg from "/assets/IAPOLogo.png";

// 1. We added { toggleTheme, isDark } so the header can receive the switch from App.jsx
function Header({ toggleTheme, isDark }) {
  const { loggedIn, userData } = useUser();

  let initial = "I";

  if (loggedIn && userData?.name) {
    initial = userData.name
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  return (
    <header className="header">
      <div className="headerLeft">
        <RegularLink href={ROUTES.HOME} className="logoContainer">
          <img src={logoImg} alt="IAPO Logo" className="logoImg" />
        </RegularLink>

        {loggedIn && (
          <RegularLink href={ROUTES.SCHEDULECREATE} className="profileButton">
            {initial}
          </RegularLink>
        )}
      </div>

      <div className="headerRight">
        {/* 2. Here is the new Dark Mode button! It flips the icon text based on the state */}
        <button
          onClick={toggleTheme}
          className="headerIconButton"
        >
          <span className="material-symbols-outlined">
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {loggedIn && (
          <RegularLink href={ROUTES.SETTINGS} className="headerIconButton">
            <span className="material-symbols-outlined">settings</span>
          </RegularLink>
        )}

        <RegularLink href={ROUTES.CONTACT} className="headerIconButton">
          <span className="material-symbols-outlined">mail</span>
        </RegularLink>
      </div>
    </header>
  );
}

export default Header;
