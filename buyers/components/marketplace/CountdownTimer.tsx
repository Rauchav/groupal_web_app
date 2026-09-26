"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
  compact?: boolean;
  // Box-style timer only (compact stays a plain text span regardless of
  // these two): "sm" shrinks it down for tight spaces like a deal card,
  // where the full checkout-page size would overwhelm the layout;
  // transparent drops the tinted background/ring, for dropping the timer
  // straight onto a card's own background instead of floating a box
  // within a box.
  size?: "md" | "sm";
  transparent?: boolean;
}

function getTimeLeft(targetDate: Date): TimeLeft {
  const total = Math.max(0, targetDate.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours   = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days    = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({
  targetDate,
  className,
  compact = false,
  size = "md",
  transparent = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(targetDate));
  const isUrgent = timeLeft.days === 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (compact) {
    return (
      <span
        suppressHydrationWarning
        className={cn(
          "font-mono font-bold tabular-nums",
          isUrgent ? "text-groupal-orange" : "text-groupal-orange",
          className
        )}
      >
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
      </span>
    );
  }

  const units = [
    { label: "days",  value: timeLeft.days    },
    { label: "hours", value: timeLeft.hours   },
    { label: "mins",  value: timeLeft.minutes },
    { label: "secs",  value: timeLeft.seconds },
  ];

  const isSmall = size === "sm";

  return (
    <div className={cn("flex items-center", isSmall ? "gap-0.5" : "gap-1", className)}>
      {units.map(({ label, value }, i) => (
        <div key={label} className={cn("flex items-center", isSmall ? "gap-0.5" : "gap-1")}>
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg",
              isSmall ? "min-w-[2rem] px-1 py-0.5" : "min-w-[2.75rem] px-1.5 py-1",
              !transparent &&
                (isUrgent
                  ? "bg-groupal-orange/10 ring-1 ring-groupal-orange/30"
                  : "bg-groupal-orange/10 ring-1 ring-groupal-orange/20")
            )}
          >
            <span
              suppressHydrationWarning
              className="font-mono font-extrabold tabular-nums leading-none text-groupal-orange"
              style={{ fontSize: isSmall ? "0.8rem" : "1.1rem" }}
            >
              {pad(value)}
            </span>
            <span
              className={cn(
                "font-medium text-groupal-orange/70 uppercase tracking-wider mt-0.5",
                isSmall ? "text-[0.5rem]" : "text-[0.6rem]"
              )}
            >
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span
              className={cn(
                "font-bold text-groupal-orange/60 select-none",
                isSmall ? "text-xs -mt-1.5" : "text-sm -mt-2"
              )}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
