import { RegularLink } from "./linking";
import settingImg from "../assets/profilepic.png";
import logoImg from "../assets/IAPOLogo.png";

function Header() {
  return (
    <div className="navContainer">
      <div className="navLeft">
        <RegularLink href="/schedulecreator">
          <img src={logoImg} className="logoImgButton"/>
        </RegularLink>
        <RegularLink href="/" className="navTitle">
          IAPO
        </RegularLink>
        {/* <RegularLink href="/schedulecreator" className="profileLabel">
          Your Schedule
        </RegularLink> */}     
      </div>
      <div className="navRight">
        <RegularLink href="/contact" className="navTitle">
          Contact
        </RegularLink>        
        <RegularLink href="/settings">
          <img src={settingImg} className="settingImgButton"/>
        </RegularLink>
        </div>
    </div>
  );
}

export default Header;
