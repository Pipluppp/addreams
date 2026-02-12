import { Link } from "react-router-dom";
import { Frame } from "../atoms/Frame";

export function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <h1 className="sr-only">Generate ads that convert faster.</h1>
        <div className="inline-flex border border-frame bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted animate-reveal-rise">
          Creative Production Studio
        </div>
        <div className="space-y-3">
          <Frame className="inline-block p-3 animate-reveal-rise [animation-delay:80ms]">
            <p className="font-display text-5xl leading-none tracking-tight sm:text-7xl">
              Generate ads
            </p>
          </Frame>
          <Frame className="inline-block p-3 animate-reveal-rise [animation-delay:150ms]">
            <p className="font-display text-5xl leading-none tracking-tight sm:text-7xl">
              that convert
            </p>
          </Frame>
          <div className="inline-flex items-center rounded-pill bg-accent px-5 py-2 font-display text-4xl leading-none text-accent-ink animate-reveal-rise [animation-delay:220ms] sm:text-5xl">
            faster
          </div>
        </div>
        <p className="max-w-2xl text-sm text-muted sm:text-base animate-reveal-rise [animation-delay:290ms]">
          Addreams gives growth teams two focused workflows: Product Shoots for fresh creative and
          Ad Graphics for fast edits to existing assets.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 animate-reveal-rise [animation-delay:360ms]">
          <Link
            to="/studio/product-shoots"
            className="inline-flex items-center justify-center rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Start in Studio
          </Link>
          <Link
            to="/studio/ad-graphics"
            className="border border-frame bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent"
          >
            Try Ad Graphics
          </Link>
        </div>
      </div>

      <div className="relative hidden min-h-72 lg:block">
        <div className="absolute right-8 top-10 h-40 w-40 rounded-full border border-frame bg-surface p-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted animate-spin-slow">
          ai powered creative ai powered creative
        </div>
        <Frame className="absolute bottom-0 left-0 max-w-xs p-4 animate-reveal-rise [animation-delay:210ms]">
          <p className="font-display text-2xl leading-tight text-ink">
            Frame-led design with one accent color.
          </p>
          <p className="mt-2 text-sm text-muted">
            Built for fast ad experimentation, not cluttered dashboards.
          </p>
        </Frame>
      </div>
    </section>
  );
}
