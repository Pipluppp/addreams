import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "../../lib/cn";

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
    <Component className={cn("border border-frame bg-surface", className)} {...rest}>
      {children}
    </Component>
  );
}
