import { Link } from "react-router-dom";
import { Frame } from "../atoms/Frame";

export function LandingFooterCta() {
  return (
    <Frame className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Ready to create
        </p>
        <h3 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Launch your first workflow now.
        </h3>
      </div>
      <Link
        to="/product-shoots"
        className="inline-flex items-center justify-center rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Open Product Shoots
      </Link>
    </Frame>
  );
}
