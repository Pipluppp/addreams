import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "accent" | "neutral";
};

export function PillButton({ className, tone = "accent", ...props }: PillButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-pill px-5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50",
        tone === "accent"
          ? "bg-accent text-accent-ink hover:bg-accent-hover"
          : "border border-frame bg-surface text-ink hover:bg-surface-soft",
        className,
      )}
      {...props}
    />
  );
}
