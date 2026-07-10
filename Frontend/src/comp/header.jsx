import { RegularLink } from "./linking";

function Header() {
  return (
    <div className="navContainer">
      <RegularLink href="/" className="navTitle">
        IAPO
      </RegularLink>
      <RegularLink href="/contact" className="navTitle">
        Contact
      </RegularLink>
    </div>
  );
}

export default Header;
