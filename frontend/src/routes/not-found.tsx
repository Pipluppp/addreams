import { Link } from "react-router-dom";
import { Card } from "@heroui/react";

export default function NotFoundRoute() {
  return (
    <section className="container-shell max-w-3xl py-16">
      <Card className="space-y-4 p-6">
        <p className="accent-type text-xs uppercase tracking-[0.16em] text-ink-muted">404</p>
        <h1 className="section-title text-ink">Page not found.</h1>
        <p className="text-sm text-ink-soft">
          The requested route does not exist in this frontend build.
        </p>
        <Link to="/" className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold">
          Return home
        </Link>
      </Card>
    </section>
  );
}
