const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

type IconProps = { size?: number };

export const BackIcon = ({ size = 22 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const CloseIcon = ({ size = 22 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PlusIcon = ({ size = 20 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const DownloadIcon = ({ size = 18 }: IconProps) => (
  <svg {...base} width={size} height={size}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
);
