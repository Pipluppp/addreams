import { Card } from "@heroui/react";
import { NavLink, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>

      <header className="container-shell py-4">
        <Card className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <NavLink
              to="/"
              className="section-title inline-flex items-center gap-2 text-[1.4rem] text-ink sm:text-[1.65rem]"
            >
              <img
                src="/brand/logo.svg"
                alt=""
                aria-hidden="true"
                width={28}
                height={28}
                className="h-[1.08em] w-[1.08em] shrink-0"
              />
              <span>addreams</span>
            </NavLink>
            <NavLink
              to="/"
              className="rounded-2xl bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-200 hover:bg-surface-alt hover:text-accent-primary"
            >
              Home
            </NavLink>
          </div>
        </Card>
      </header>

      <main id="main-content" className="pb-8 sm:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
