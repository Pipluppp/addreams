import { useState } from "react";
import { Card, Disclosure, Dropdown, Avatar, Label, Button } from "@heroui/react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { useSession, authClient } from "../../lib/auth-client";

const navItems = [
  { to: "/product-shoots", label: "Product Shoots", tint: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
  { to: "/ad-graphics", label: "Ad Graphics", tint: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
  { to: "/history", label: "History", tint: "bg-[#FFF3BF] text-ink hover:bg-[#FFE9A0]" },
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getUserDisplayName(name: string | null | undefined, email: string | null | undefined): string {
  const cleanName = name?.trim();
  if (cleanName) return cleanName;

  const cleanEmail = email?.trim();
  if (!cleanEmail) return "User";

  const localPart = cleanEmail.split("@")[0]?.trim();
  return localPart || cleanEmail;
}

function UserMenu() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  if (isPending) return null;

  if (!session) {
    return (
      <NavLink
        to="/login"
        className="rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-200 hover:bg-surface/80"
      >
        Sign In
      </NavLink>
    );
  }

  const user = session.user;
  const displayName = getUserDisplayName(user.name, user.email);

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button aria-label="User menu" variant="ghost" className="max-w-[16rem] gap-2 rounded-2xl px-2.5 py-1.5">
          <Avatar className="size-8 shrink-0">
            {user.image ? (
              <Avatar.Image alt={displayName} src={user.image} />
            ) : null}
            <Avatar.Fallback>{getInitials(displayName)}</Avatar.Fallback>
          </Avatar>
          <span className="truncate text-xs font-semibold text-ink">{displayName}</span>
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "profile") navigate("/profile");
            if (key === "signout") {
              authClient.signOut().then(() => navigate("/"));
            }
          }}
        >
          <Dropdown.Item id="profile" textValue="Profile">
            <Label>Profile</Label>
          </Dropdown.Item>
          <Dropdown.Item id="signout" textValue="Sign Out" variant="danger">
            <Label>Sign Out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

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

            <Disclosure
              isExpanded={menuOpen}
              onExpandedChange={setMenuOpen}
              className="md:hidden"
            >
              <Disclosure.Heading>
                <Disclosure.Trigger
                  className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink"
                  aria-label="Toggle navigation"
                >
                  Menu
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body>
                  <nav className="mt-3 flex flex-col gap-2 pt-3">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "rounded-xl px-3 py-2 text-sm transition-colors duration-200",
                            item.tint,
                          )
                        }
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>

            <div className="hidden items-center gap-2 md:flex">
              <nav className="flex items-center gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-200",
                        item.tint,
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <UserMenu />
            </div>
          </div>
        </Card>
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
            <NavLink
              to="/product-shoots"
              className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Build your visual
            </NavLink>
          </div>
        </section>

        <section className="bg-ink text-surface">
          <div className="container-shell grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <p className="section-title text-[1.5rem] text-surface">addreams</p>
              <p className="text-sm text-surface/70">
                Creative workflows for Product Shoots and Ad Graphics.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface">Workflows</h3>
              <ul className="space-y-2 text-sm text-surface/75">
                <li>
                  <NavLink to="/product-shoots" className="hover:text-surface">
                    Product Shoots
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/ad-graphics" className="hover:text-surface">
                    Ad Graphics
                  </NavLink>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface">Platform</h3>
              <ul className="space-y-2 text-sm text-surface/75">
                <li>
                  <span>API Status</span>
                </li>
                <li>
                  <span>Documentation</span>
                </li>
                <li>
                  <span>Changelog</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface">Company</h3>
              <ul className="space-y-2 text-sm text-surface/75">
                <li>
                  <span>About</span>
                </li>
                <li>
                  <span>Contact</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface">Legal</h3>
              <ul className="space-y-2 text-sm text-surface/75">
                <li>
                  <span>Privacy Policy</span>
                </li>
                <li>
                  <span>Terms of Use</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </footer>
    </div>
  );
}
