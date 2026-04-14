import * as React from "react";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  image,
  size = 28,
  className,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const dims = { width: size, height: size, fontSize: Math.max(10, size * 0.4) };
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ""}
        style={dims}
        className={cn("rounded-full border object-cover", className)}
      />
    );
  }
  return (
    <span
      style={dims}
      className={cn(
        "inline-flex items-center justify-center rounded-full border bg-slate-100 font-medium text-slate-700",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
