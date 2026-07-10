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

      <p className="navTitle" onClick={() => navigate("/")}>
        IAPO
      </p>

      <p className="navOther" onClick={() => navigate("/contact")}>
        Contact
      </p>
    </div>
  );
}

export default Header;
