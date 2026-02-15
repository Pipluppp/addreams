import { cn } from "../../lib/cn";

type DemoGuideButtonProps = {
  color: "orange" | "blue";
  onPress: () => void;
};

export function DemoGuideButton({ color, onPress }: DemoGuideButtonProps) {
  const isOrange = color === "orange";

  return (
    <button
      type="button"
      aria-label="Show demo guide"
      onClick={onPress}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition-shadow duration-200 hover:shadow-xl sm:size-16",
        "animate-[bounce_2s_ease-in-out_infinite]",
        isOrange
          ? "bg-orange-500/15 hover:bg-orange-500/25"
          : "bg-blue-500/15 hover:bg-blue-500/25",
      )}
    >
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        fill="none"
        className="size-10 animate-[spin_5s_linear_infinite] sm:size-11"
        aria-hidden="true"
      >
        <path
          d="M174.939 84.9487C197.479 -28.3163 122.549 -28.3163 145.079 84.9487C122.549 -28.3163 53.3257 0.3508 117.489 96.3788C53.3257 0.3508 0.350739 53.3288 96.3787 117.489C0.350739 53.3288 -28.3163 122.549 84.9487 145.069C-28.3163 122.539 -28.3163 197.459 84.9487 174.929C-28.3163 197.459 0.364738 266.669 96.3787 202.509C0.364738 266.669 53.3387 319.649 117.489 223.619C53.3257 319.629 122.549 348.299 145.069 235.049C122.539 348.319 197.459 348.319 174.929 235.049C197.459 348.319 266.669 319.629 202.509 223.619C266.669 319.629 319.649 266.659 223.619 202.509C319.629 266.669 348.299 197.449 235.049 174.929C348.319 197.459 348.319 122.539 235.049 145.069C348.319 122.539 319.629 53.3288 223.619 117.489C319.629 53.3288 266.659 0.3508 202.509 96.3788C266.669 0.364799 197.449 -28.3033 174.929 84.9487H174.939Z"
          fill={isOrange ? "#f97316" : "#3b82f6"}
        />
      </svg>
      <span
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-black",
          isOrange ? "text-orange-950" : "text-blue-950",
        )}
      >
        ?
      </span>
    </button>
  );
}
