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

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg min-w-[2.75rem] px-1.5 py-1",
              isUrgent
                ? "bg-groupal-orange/10 ring-1 ring-groupal-orange/30"
                : "bg-groupal-orange/10 ring-1 ring-groupal-orange/20"
            )}
          >
            <span
              className="font-mono font-extrabold tabular-nums leading-none text-groupal-orange"
              style={{ fontSize: "1.1rem" }}
            >
              {pad(value)}
            </span>
            <span className="text-[0.6rem] font-medium text-groupal-orange/70 uppercase tracking-wider mt-0.5">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="font-bold text-groupal-orange/60 text-sm -mt-2 select-none">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
