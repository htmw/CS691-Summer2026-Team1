import { Link, useLocation, useNavigate } from "react-router-dom";

export const RegularLink = ({ href, className, children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isInternal = href.startsWith("/");
  const isSamePage = isInternal && location.pathname === href;

  const handleClick = (e) => {
    if (!isInternal) return;

    e.preventDefault();

    if (!isSamePage) {
      navigate(href);
    }

    // Always scroll to top for internal links
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth", // remove if you want instant
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
