// Native Sun Homes brand mark — sun rising over a roofline (matches the logo
// and favicon). Sized by the parent via the `size` prop.
export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Native Sun Homes"
      className="brand__logo"
    >
      <defs>
        <linearGradient id="nshSunHeader" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef7a1a" />
          <stop offset="0.55" stopColor="#f6991f" />
          <stop offset="1" stopColor="#fbbf3a" />
        </linearGradient>
      </defs>
      <g stroke="url(#nshSunHeader)" strokeWidth="4" strokeLinecap="round">
        <line x1="32" y1="27" x2="32" y2="6" />
        <line x1="32" y1="27" x2="19" y2="11" />
        <line x1="32" y1="27" x2="45" y2="11" />
        <line x1="32" y1="27" x2="9" y2="19" />
        <line x1="32" y1="27" x2="55" y2="19" />
      </g>
      <path d="M21 35 C 14.5 35.5, 9.5 38, 5 41" fill="none" stroke="url(#nshSunHeader)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M43 35 C 49.5 35.5, 54.5 38, 59 41" fill="none" stroke="url(#nshSunHeader)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M21 35 L32 26 L43 35" fill="none" stroke="url(#nshSunHeader)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
      <g fill="#11367f">
        <rect x="29.2" y="30" width="2.5" height="2.5" rx="0.4" />
        <rect x="32.3" y="30" width="2.5" height="2.5" rx="0.4" />
        <rect x="29.2" y="33.1" width="2.5" height="2.5" rx="0.4" />
        <rect x="32.3" y="33.1" width="2.5" height="2.5" rx="0.4" />
      </g>
    </svg>
  );
}
