type ThumbProps = {
  id: string;
  label?: string;
  className?: string;
};

function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export default function Thumb({ id, label = "Sample", className }: ThumbProps) {
  const hue = hueFromId(id);
  const patternId = `stripes-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const bg = `hsl(${hue} 25% 18%)`;
  const fg = `hsl(${hue} 35% 75%)`;
  const accent = `hsl(${hue} 55% 55%)`;

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <defs>
        <pattern
          id={patternId}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <rect width="14" height="14" fill={bg} />
          <line x1="0" y1="0" x2="0" y2="14" stroke={fg} strokeOpacity="0.15" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="180" fill={`url(#${patternId})`} />
      <circle cx="230" cy="70" r="34" fill={accent} opacity="0.9" />
      <rect x="30" y="110" width="120" height="8" fill={fg} opacity="0.35" />
      <rect x="30" y="126" width="70" height="6" fill={fg} opacity="0.25" />
      <text
        x="16"
        y="28"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="10"
        fill={fg}
        opacity="0.7"
        letterSpacing="1.5"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}
