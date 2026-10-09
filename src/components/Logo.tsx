"use client";

import { cn } from "@/lib/cn";

// Titulo estilizado de la aplicacion, hecho con tipografia y color.
export function Logo({ className }: { className?: string }) {
  return (
    <h1
      className={cn(
        "font-display flex items-center justify-center gap-1.5 sm:gap-2.5 select-none leading-none",
        className
      )}
    >
      <span className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-[var(--color-acento)] to-[#4fcbb0] bg-clip-text text-transparent">
        2048
      </span>
      <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--color-acento)] to-[var(--color-acento-2)] text-white text-2xl sm:text-3xl font-extrabold rotate-3">
        ×
      </span>
      <span className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-[var(--color-acento-2)] to-[var(--color-tile-2048)] bg-clip-text text-transparent">
        2048
      </span>
    </h1>
  );
}
