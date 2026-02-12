import { Link } from "react-router-dom";
import { Frame } from "../components/atoms/Frame";
import { PillButton } from "../components/atoms/PillButton";

export default function NotFoundRoute() {
  return (
    <section className="container-shell max-w-3xl py-16">
      <Frame className="space-y-4 p-6">
        <p className="accent-type text-xs uppercase tracking-[0.16em] text-ink-muted">404</p>
        <h1 className="section-title text-ink">Page not found.</h1>
        <p className="text-sm text-ink-soft">
          The requested route does not exist in this frontend build.
        </p>
        <PillButton tone="primary" asChild>
          <Link to="/">Return home</Link>
        </PillButton>
      </Frame>
    </section>
  );
}
