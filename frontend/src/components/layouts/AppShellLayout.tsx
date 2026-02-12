import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Frame } from "../atoms/Frame";
import { PillButton } from "../atoms/PillButton";

const navItems = [
  { to: "/product-shoots", label: "Product Shoots" },
  { to: "/ad-graphics", label: "Ad Graphics" },
];

export function AppShellLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>

      <header className="container-shell py-4">
        <Frame className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <NavLink
              to="/"
              className="section-title inline-flex items-center gap-2 text-[1.4rem] text-ink sm:text-[1.65rem]"
            >
              <img
                src="/brand/logo.svg"
                alt=""
                aria-hidden="true"
                className="h-[1.08em] w-[1.08em] shrink-0"
              />
              <span>addreams</span>
            </NavLink>

            <button
              type="button"
              className="bg-surface px-3 py-1.5 text-xs font-semibold text-ink md:hidden"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Toggle navigation"
            >
              Menu
            </button>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-200",
                      isActive ? "text-accent-primary" : "text-ink-soft hover:text-accent-primary",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {menuOpen ? (
            <nav className="mt-3 flex flex-col gap-2 pt-3 md:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "bg-surface px-3 py-2 text-sm transition-colors duration-200",
                      isActive ? "text-accent-primary" : "text-ink-soft",
                    )
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </Frame>
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="mt-14 sm:mt-18">
        <section className="container-shell py-14">
          <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4">
              <h2 className="section-title max-w-[18ch] text-ink">
                Seen enough? Build your next ad visual now.
              </h2>
              <p className="max-w-[56ch] text-base text-ink-soft">
                Start with Product Shoots or Ad Graphics, iterate quickly, and ship with clarity.
              </p>
            </div>
            <PillButton tone="primary" asChild>
              <NavLink to="/product-shoots">Build your visual</NavLink>
            </PillButton>
          </div>
        </section>

        <section className="bg-[#08090c] text-[#f1f1f1]">
          <div className="container-shell grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <p className="section-title text-[1.5rem] text-white">addreams</p>
              <p className="text-sm text-white/70">
                Creative workflows for Product Shoots and Ad Graphics.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Workflows</h3>
              <ul className="space-y-2 text-sm text-white/75">
                <li>
                  <NavLink to="/product-shoots" className="hover:text-white">
                    Product Shoots
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/ad-graphics" className="hover:text-white">
                    Ad Graphics
                  </NavLink>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Platform</h3>
              <ul className="space-y-2 text-sm text-white/75">
                <li>
                  <a href="#" className="hover:text-white">
                    API Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-2 text-sm text-white/75">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-white/75">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Use
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </footer>
    </div>
  );
}
