import { Link } from "react-router-dom";

// Flexible call-to-action: renders a router Link (`to`), an external anchor
// (`href`), or a <button> (onClick) — all sharing the same button styling.
export default function CTAButton({
  to,
  href,
  onClick,
  variant = "primary",
  size,
  block,
  children,
  ...rest
}) {
  const cls = [
    "btn",
    `btn--${variant}`,
    size === "sm" && "btn--sm",
    block && "btn--block",
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
