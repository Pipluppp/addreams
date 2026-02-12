import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { SquircleSurface } from "./SquircleSurface";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "neutral";
  asChild?: boolean;
};

export function PillButton({
  className,
  tone = "primary",
  asChild = false,
  ...props
}: PillButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <SquircleSurface asChild radius="xxl" smooth="xl">
      <Component
        className={cn(
          "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          tone === "primary" && "bg-accent-primary text-on-primary hover:bg-accent-primary-hover",
          tone === "secondary" &&
            "bg-accent-secondary text-on-secondary hover:bg-accent-secondary-hover",
          tone === "neutral" &&
            "bg-surface text-ink hover:bg-surface-alt hover:text-accent-primary",
          className,
        )}
        {...props}
      />
    </SquircleSurface>
  );
}
