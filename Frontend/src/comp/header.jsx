import { RegularLink } from "./linking";
import settingImg from "/assets/profilepic.png";
import logoImg from "/assets/IAPOLogo.png";
import "./compStyles.css";

function Header() {
  const initial ="Y";// user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="header">
      <div className="headerLeft">
        <RegularLink href="/" className="logoContainer">
          <img src={logoImg} alt="IAPO Logo" className="logoImg" />
          <span className="logoText">IAPO</span>
        </RegularLink>

         <RegularLink href="/profile" className="profileButton">
          {initial}
        </RegularLink>
      </div>

      <div className="headerRight">
        <RegularLink href="/contact" className="headerIconButton">
          <span className="material-symbols-outlined">mail</span>
        </RegularLink>

        <RegularLink href="/settings" className="headerIconButton">
          <span className="material-symbols-outlined">settings</span>
        </RegularLink>

       
      </div>
    </header>
  );
}


export default Header;
