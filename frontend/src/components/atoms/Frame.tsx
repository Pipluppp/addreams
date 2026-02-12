import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { SquircleSurface } from "./SquircleSurface";

type FrameProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Frame<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: FrameProps<T>) {
  const Component = as ?? "div";

  return (
    <SquircleSurface asChild radius="xl" smooth="lg">
      <Component
        className={cn(
          "bg-surface shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)]",
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    </SquircleSurface>
  );
}
