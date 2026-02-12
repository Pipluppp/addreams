import { Link } from "react-router-dom";
import { Frame } from "../components/atoms/Frame";

export default function NotFoundRoute() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Frame className="space-y-4 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">404</p>
        <h1 className="font-display text-4xl text-ink">Page not found.</h1>
        <p className="text-sm text-muted">
          The requested route does not exist in this frontend build.
        </p>
        <Link
          to="/"
          className="inline-flex border border-frame bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent"
        >
          Return home
        </Link>
      </Frame>
    </section>
  );
}
