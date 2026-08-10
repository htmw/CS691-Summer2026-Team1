import { Link, useLocation, useNavigate } from "react-router-dom";

//Simplified version of regular link that only works for internal pages
export const goToNav = () => {
  const navigate = useNavigate();

  return (href) => {
    navigate(href);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };
};

//Prevents the site from reloading if loading an internal link
export const RegularLink = ({ href, className, children, onClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isInternal = href.startsWith("/");
  const isSamePage = isInternal && location.pathname === href;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }

    if (!isInternal) return;

    e.preventDefault();

    if (!isSamePage) {
      navigate(href);
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  if (isInternal) {
    return (
      <Link to={href} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
