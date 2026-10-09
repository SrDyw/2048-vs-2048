"use client";

import type { SVGProps } from "react";

// Iconos SVG creados a mano. Sin librerias ni emojis.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

// Dos rectangulos superpuestos (copiar).
export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  );
}

// Marca de verificacion.
export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

// Corona para el ganador.
export function CrownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7l4 4 5-7 5 7 4-4-2 11H5L3 7z" />
      <path d="M5 21h14" />
    </svg>
  );
}

// Usuario para los slots del lobby.
export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

// Flecha circular (revancha).
export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 1 0-1.5 6" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

// Flecha hacia puerta (salir).
export function ExitIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12H3" />
      <path d="M6 8l-3 4 3 4" />
    </svg>
  );
}

// Trofeo (alternativa a la corona).
export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4" />
      <path d="M17 6h2.5a2.5 2.5 0 0 1-2.5 4" />
      <path d="M12 14v3" />
      <path d="M9 21h6" />
      <path d="M9.5 17h5l.5 4h-6l.5-4z" />
    </svg>
  );
}

// Indicador de carga giratorio.
export function SpinnerIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
      className={["animate-spin", props.className].filter(Boolean).join(" ")}
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

// Casa (salir al inicio).
export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}

// Reloj con flecha (historial).
export function HistoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3.5 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}
