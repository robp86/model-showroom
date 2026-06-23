// Central nav definition reused by header, mobile menu and footer.
export const NAV_LINKS = [
  { to: "/find", label: "Find a Home" },
  { to: "/homes", label: "Our Homes" },
  { to: "/floor-plans", label: "Floor Plans" },
  { to: "/category/has-tour", label: "Virtual Tours" },
  { to: "/series", label: "Series" },
  { to: "/financing", label: "Financing" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

// Trimmed set shown in the desktop top bar.
export const PRIMARY_NAV = NAV_LINKS.filter((l) =>
  ["/find", "/homes", "/floor-plans", "/category/has-tour", "/series", "/how-it-works", "/about"].includes(
    l.to
  )
);
