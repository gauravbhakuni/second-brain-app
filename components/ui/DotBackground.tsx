import { cn } from "@/lib/utils";
import React from "react";

export function DotBackgroundDemo({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Dot grid background */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#404040_1px,transparent_1px)]",
        )}
      />

      {/* Radial gradient fade */}
      <div className="pointer-events-none absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      {/* Children content */}
      <div className="relative z-20 w-full">{children}</div>
    </div>
  );
}
