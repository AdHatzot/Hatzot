export interface LauncherIconProps {
  className?: string;
  size?: number;
}

/**
 * ShieldNest-Lite: Blue diamond shape with inner rhombus/dot
 */
export function ShieldNestIcon({ className = "", size = 28 }: LauncherIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect
        x="16"
        y="3"
        width="18"
        height="18"
        rx="2"
        transform="rotate(45 16 3)"
        stroke="#38bdf8"
        strokeWidth="2.5"
        fill="#0b243b"
        fillOpacity="0.4"
      />
      <rect
        x="16"
        y="9.5"
        width="9"
        height="9"
        rx="1"
        transform="rotate(45 16 9.5)"
        fill="#38bdf8"
      />
    </svg>
  );
}

/**
 * IronHook-SR: Orange double chevrons pointing upwards
 */
export function IronHookIcon({ className = "", size = 28 }: LauncherIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Top chevron */}
      <path
        d="M8 14L16 6L24 14"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom chevron */}
      <path
        d="M8 22L16 14L24 22"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * HorizonEye-MX: Green triangle / delta
 */
export function HorizonEyeIcon({ className = "", size = 28 }: LauncherIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M16 5L27 25H5L16 5Z"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="#052e16"
        fillOpacity="0.3"
      />
      <path
        d="M16 14L20 22H12L16 14Z"
        fill="#22c55e"
      />
    </svg>
  );
}

/**
 * CloudFence-Area: Purple hexagon
 */
export function CloudFenceIcon({ className = "", size = 28 }: LauncherIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M16 4L26 9.77V21.32L16 27.1L6 21.32V9.77L16 4Z"
        stroke="#a855f7"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="#2e1065"
        fillOpacity="0.3"
      />
      <circle cx="16" cy="15.5" r="3.5" fill="#c084fc" />
    </svg>
  );
}

/**
 * Fallback generic launcher icon
 */
export function GenericLauncherIcon({ className = "", size = 28 }: LauncherIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect
        x="6"
        y="6"
        width="20"
        height="20"
        rx="4"
        stroke="#94a3b8"
        strokeWidth="2"
        fill="#1e293b"
      />
      <circle cx="16" cy="16" r="4" fill="#94a3b8" />
    </svg>
  );
}

export function getLauncherTypeIconUrl(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("ironhook")) return "/icons/IronHook-SR.svg";
  if (normalized.includes("horizoneye")) return "/icons/HorizonEye-MX.svg";
  if (normalized.includes("cloudfence")) return "/icons/CloudFence-Area.svg";
  return "/icons/blue-marker.svg";
}

export function getLauncherTypeIcon(name: string, size = 28): JSX.Element {
  const iconPath = getLauncherTypeIconUrl(name);

  return (
    <img
      src={iconPath}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 object-contain"
    />
  );
}

export function getLauncherTypeColor(name: string): {
  border: string;
  badge: string;
  accent: string;
} {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("shieldnest")) {
    return {
      border: "border-sky-500/40",
      badge: "bg-sky-500/10 text-sky-400",
      accent: "#38bdf8",
    };
  }
  if (normalized.includes("ironhook")) {
    return {
      border: "border-orange-500/40",
      badge: "bg-orange-500/10 text-orange-400",
      accent: "#f97316",
    };
  }
  if (normalized.includes("horizoneye")) {
    return {
      border: "border-emerald-500/40",
      badge: "bg-emerald-500/10 text-emerald-400",
      accent: "#22c55e",
    };
  }
  if (normalized.includes("cloudfence")) {
    return {
      border: "border-purple-500/40",
      badge: "bg-purple-500/10 text-purple-400",
      accent: "#a855f7",
    };
  }
  return {
    border: "border-slate-500/40",
    badge: "bg-slate-500/10 text-slate-300",
    accent: "#94a3b8",
  };
}
