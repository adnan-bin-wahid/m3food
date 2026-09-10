"use client";

import { useEffect, useState } from "react";
import { cn } from "./utils";

interface CountdownTimerProps {
  /** ISO string or Date object for the end time */
  endsAt?: string | Date;
  /** Alternative to endsAt: count down from now for this many hours. */
  durationHours?: number;
  className?: string;
  lang?: "en" | "bn";
  /** Called when the countdown reaches zero */
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(endsAt: Date): TimeLeft {
  const diff = Math.max(0, endsAt.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function resolveEndDate(endsAt?: string | Date, durationHours?: number) {
  if (endsAt instanceof Date) return endsAt;
  if (typeof endsAt === "string") return new Date(endsAt);
  return new Date(Date.now() + (durationHours ?? 24) * 60 * 60 * 1000);
}

function Digit({ value, label, bn = false }: { value: number; label: string; bn?: boolean }) {
  const displayVal = bn
    ? String(value).padStart(2, "0").replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)])
    : String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="flex min-w-[2.5rem] items-center justify-center rounded-md bg-[var(--color-text-primary)] px-2 py-1 text-xl font-bold tabular-nums text-white">
        {displayVal}
      </div>
      <span className="mt-1 text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/** Live dd:hh:mm:ss countdown blocks — used in flash sale sections. */
export function CountdownTimer({
  endsAt,
  durationHours,
  className,
  lang = "en",
  onExpire,
}: CountdownTimerProps) {
  const [end, setEnd] = useState<Date | null>(null);
  useEffect(() => { setEnd(resolveEndDate(endsAt, durationHours)); }, [endsAt, durationHours]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 23, minutes: 59, seconds: 59 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (expired || !end) return;
    const id = setInterval(() => {
      const t = getTimeLeft(end);
      setTimeLeft(t);
      if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
        setExpired(true);
        onExpire?.();
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [end, expired, onExpire]);

  if (expired) return null;

  const isBn = lang === "bn";

  return (
    <div className={cn("flex items-end gap-2", className)}>
      {timeLeft.days > 0 && <Digit value={timeLeft.days} label={isBn ? "দিন" : "Days"} bn={isBn} />}
      <Digit value={timeLeft.hours} label={isBn ? "ঘণ্টা" : "Hrs"} bn={isBn} />
      <Digit value={timeLeft.minutes} label={isBn ? "মিনিট" : "Min"} bn={isBn} />
      <Digit value={timeLeft.seconds} label={isBn ? "সেকেন্ড" : "Sec"} bn={isBn} />
    </div>
  );
}
