import { RegularLink } from "./linking";
import { ROUTES } from "../routes.js";
import settingImg from "/assets/profilepic.png";
import logoImg from "/assets/IAPOLogo.png";
import "./compStyles.css";

function Header() {
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
