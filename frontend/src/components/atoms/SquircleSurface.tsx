import { Squircle } from "@squircle-js/react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import {
  SQUIRCLE_RADIUS,
  SQUIRCLE_SMOOTH,
  type SquircleRadius,
  type SquircleSmooth,
} from "../../lib/squircle";

type SquircleSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  radius?: SquircleRadius;
  smooth?: SquircleSmooth;
  children: ReactNode;
  style?: CSSProperties;
};

export function SquircleSurface({
  asChild,
  radius = "lg",
  smooth = "lg",
  className,
  style,
  children,
  ...props
}: SquircleSurfaceProps) {
  return (
    <Squircle
      asChild={asChild}
      cornerRadius={SQUIRCLE_RADIUS[radius]}
      cornerSmoothing={SQUIRCLE_SMOOTH[smooth]}
      className={cn(
        "transition-[background-color,color,opacity,transform] duration-200",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </Squircle>
  );
}
