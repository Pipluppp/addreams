import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type LandingSectionProps = {
  className?: string;
  children: ReactNode;
};

export function LandingSection({ className, children }: LandingSectionProps) {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24", className)}>
      {children}
    </section>
  );
}
