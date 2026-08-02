import { RegularLink } from "./linking";
import { ROUTES } from "../routes.js";
import settingImg from "/assets/profilepic.png";
import logoImg from "/assets/IAPOLogo.png";
import "./compStyles.css";

// 1. We added { toggleTheme, isDark } so the header can receive the switch from App.jsx
function Header({ toggleTheme, isDark }) {
  const initial ="Y";// user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="header">
      <div className="headerLeft">
        <RegularLink href={ROUTES.HOME} className="logoContainer">
          <img src={logoImg} alt="IAPO Logo" className="logoImg" />
        </RegularLink>

         <RegularLink href={ROUTES.SCHEDULECREATE} className="profileButton">
          {initial}
        </RegularLink>
      </div>

      <div className="headerRight">
        {/* 2. Here is the new Dark Mode button! It flips the icon text based on the state */}
        <button 
          onClick={toggleTheme} 
          className="headerIconButton" 
          title="Toggle Dark Mode"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          <span className="material-symbols-outlined">
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        <RegularLink href={ROUTES.CONTACT} className="headerIconButton">
          <span className="material-symbols-outlined">mail</span>
        </RegularLink>

        <RegularLink href={ROUTES.SETTINGS} className="headerIconButton">
          <span className="material-symbols-outlined">settings</span>
        </RegularLink>
      </div>
    </header>
  );
}

export default Header;