"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface DoctorAvatarProps {
  name: string;
  size?: "sm" | "md";
}

const SIZE_MAP = {
  sm: 28,
  md: 36,
};

export function DoctorAvatar({ name, size = "sm" }: DoctorAvatarProps) {
  const px = SIZE_MAP[size];
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border bg-slate-100",
        size === "sm" ? "h-7 w-7" : "h-9 w-9"
      )}
      aria-label={`Avatar for ${name}`}
    >
      <Image src="/doctor-placeholder.svg" alt="" width={px} height={px} />
    </div>
  );
}
