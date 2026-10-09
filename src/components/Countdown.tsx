"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  from: number;
  onComplete: () => void;
}

// Cuenta atras 3 - 2 - 1 - YA con animacion de escala y fade.
export function Countdown({ from, onComplete }: CountdownProps) {
  const [step, setStep] = useState(0);

  const labels = [
    ...Array.from({ length: from }, (_, i) => String(from - i)),
    "YA",
  ];
  const isLast = step === labels.length - 1;

  useEffect(() => {
    if (step >= labels.length) {
      onComplete();
      return;
    }
    const delay = isLast ? 700 : 900;
    const timer = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step >= labels.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-crema)]/85 backdrop-blur-sm">
      <span
        key={step}
        className="countdown-number text-[7rem] sm:text-[10rem] font-bold text-[var(--color-acento)]"
      >
        {labels[step]}
      </span>
    </div>
  );
}
