import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/studio/product-shoots", label: "Product Shoots" },
  { to: "/studio/ad-graphics", label: "Ad Graphics" },
];

export function AppShellLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-frame focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to main content
      </a>
      <header className="border-b border-frame">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <NavLink to="/" className="font-display text-2xl tracking-tight text-ink">
            Addreams
          </NavLink>

          <button
            type="button"
            className="border border-frame px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            Menu
          </button>

          <nav className="hidden items-center gap-4 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-200 hover:text-accent",
                    isActive ? "text-accent" : "text-ink",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/studio/product-shoots"
              className="inline-flex items-center justify-center rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Open Studio
            </NavLink>
          </nav>
        </div>

        {menuOpen ? (
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-frame px-4 py-4 md:hidden sm:px-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="border border-frame bg-surface px-3 py-2 text-sm text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/studio/product-shoots"
              onClick={() => setMenuOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Open Studio
            </NavLink>
          </nav>
        ) : null}
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="border-t border-frame">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
          Addreams MVP frontend. Product Shoots and Ad Graphics run against stub Hono workflows.
        </div>
      </footer>
    </div>
  );
}
