import { Link } from "react-router-dom";
import { Card } from "@heroui/react";

const LAMP_PROMPT =
  "Graphic design layout for a social media ad featuring the provided IKEA BL\u00c5SVERK lamp. Center the lamp as the hero product. Place a large, crisp, perfect white circle directly behind the lamp\u2026";

const COOKIE_PROMPT =
  "A hyper-realistic, high-speed commercial food photograph of a thick, gourmet chocolate chip cookie being dunked into a glass of cold milk. Captured at the exact moment of impact\u2026";

const proofStats = [
  { label: "Workflow States", value: "6-Step Guided" },
  { label: "Creative Paths", value: "2 Core Flows" },
  { label: "Validation Coverage", value: "Input, Review, Result" },
] as const;

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/month",
    tone: "neutral" as const,
    points: ["20 generations", "1 teammate", "Basic export sizes"],
  },
  {
    name: "Growth",
    price: "$29",
    cadence: "/month",
    tone: "secondary" as const,
    points: ["400 generations", "5 teammates", "Priority queue"],
  },
  {
    name: "Scale",
    price: "$99",
    cadence: "/month",
    tone: "primary" as const,
    points: ["Unlimited drafts", "20 teammates", "Advanced governance"],
  },
] as const;

export default function HomeRoute() {
  return (
    <>
      <section className="container-shell py-14 sm:py-18">
        <Card className="overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <p className="accent-type text-xs uppercase tracking-[0.2em] text-ink-muted">
                Addreams Workflows
              </p>
              <h1 className="hero-title max-w-[18ch] text-ink">
                Build production-ready ad visuals with a{" "}
                <span className="accent-type text-accent-secondary">guided workflow</span>.
              </h1>
              <p className="max-w-[60ch] text-sm text-ink-soft sm:text-base">
                Product Shoots and Ad Graphics now share a unified stepper flow, validation gates,
                persistent state, and review-first generation controls.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/product-shoots"
                  className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
                >
                  Start Product Shoots
                </Link>
                <Link
                  to="/ad-graphics"
                  className="button button--secondary rounded-2xl px-5 py-2.5 text-sm font-semibold"
                >
                  Start Ad Graphics
                </Link>
              </div>
            </div>

            <Card className="space-y-5 bg-surface-alt p-6 sm:p-7">
              <p className="max-w-[42ch] text-sm leading-relaxed text-ink-soft">
                Built for teams who need clean outputs, reusable settings, and fast creative
                iteration across both workflows.
              </p>
              <div className="grid gap-3 text-sm">
                <div className="rounded-2xl bg-surface px-5 py-3.5 text-ink">Creative Brief</div>
                <div className="rounded-2xl bg-surface px-5 py-3.5 text-ink">
                  Inputs + Controls
                </div>
                <div className="rounded-2xl bg-surface px-5 py-3.5 text-ink">Review + Generate</div>
                <div className="rounded-2xl bg-surface px-5 py-3.5 text-ink">Result + Iterate</div>
              </div>
            </Card>
          </div>
        </Card>
      </section>

      <section className="container-shell pb-7 sm:pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {proofStats.map((item) => (
            <Card key={item.label} className="p-4">
              <p className="accent-type text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{item.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink-muted">
              Capabilities
            </p>
            <h2 className="section-title text-ink">
              Two creative flows, each purpose-built for conversion teams.
            </h2>
          </div>
          <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
            Flat, connected stage blocks keep context and outputs aligned, so each workflow reads
            as one continuous system.
          </p>
        </div>

        <div className="grid gap-5">
          <Card className="overflow-hidden border border-border/70 p-0 shadow-none">
            <div className="grid gap-px bg-border/70 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]">
              <div className="space-y-4 bg-surface p-5 sm:p-6">
                <div className="inline-flex rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-500">
                  <span className="accent-type uppercase tracking-[0.14em]">Product Shoots</span>
                </div>
                <h3 className="ui-title text-ink">Reference-Based Product Shoots</h3>
                <p className="max-w-[48ch] text-sm text-ink-soft">
                  Upload or link a product image, write a shoot direction, and generate ad-ready
                  variants with precise edits.
                </p>
                <Link
                  to="/product-shoots"
                  className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
                >
                  Try Product Shoots
                </Link>
              </div>

              <div className="grid gap-px bg-border/70 sm:grid-cols-3">
                <div className="bg-canvas p-4 sm:p-5">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    01 Input Image
                  </p>
                  <div className="relative mt-3 overflow-hidden rounded-[var(--radius-sm)] bg-surface ring-1 ring-border/70">
                    <img
                      src="/demo_guide/product-shoot/lamp_input.jpg"
                      alt="Lamp product input"
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full rounded-[var(--radius-sm)] object-cover"
                    />
                  </div>
                </div>

                <div className="bg-[var(--color-accent-secondary-soft)] p-4 sm:p-5">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    02 Prompt
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{LAMP_PROMPT}</p>
                </div>

                <div className="bg-canvas p-4 sm:p-5">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    03 Generated Output
                  </p>
                  <div className="relative mt-3 overflow-hidden rounded-[var(--radius-sm)] bg-surface ring-1 ring-border/70">
                    <img
                      src="/demo_guide/product-shoot/lamp_generated.png"
                      alt="Lamp generated ad"
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full rounded-[var(--radius-sm)] object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border border-border/70 p-0 shadow-none">
            <div className="grid gap-px bg-border/70 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]">
              <div className="space-y-4 bg-surface p-5 sm:p-6">
                <div className="inline-flex rounded-xl bg-blue-500/15 px-3 py-1 text-xs text-blue-500">
                  <span className="accent-type uppercase tracking-[0.14em]">Ad Graphics</span>
                </div>
                <h3 className="ui-title text-ink">Text-to-Image Ad Graphics</h3>
                <p className="max-w-[48ch] text-sm text-ink-soft">
                  Describe your ad graphic in a prompt, pick size and format, then generate
                  campaign-ready visuals directly.
                </p>
                <Link
                  to="/ad-graphics"
                  className="button button--secondary rounded-2xl px-5 py-2.5 text-sm font-semibold"
                >
                  Try Ad Graphics
                </Link>
              </div>

              <div className="grid gap-px bg-border/70 sm:grid-cols-2">
                <div className="bg-[var(--color-accent-primary-soft)] p-4 sm:p-5">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    01 Prompt
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{COOKIE_PROMPT}</p>
                </div>

                <div className="bg-canvas p-4 sm:p-5">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    02 Generated Output
                  </p>
                  <div className="relative mt-3 overflow-hidden rounded-[var(--radius-sm)]">
                    <img
                      src="/demo_guide/ad-graphics/cookie.png"
                      alt="Cookie ad graphic"
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mb-6 space-y-2">
          <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink-muted">Pricing</p>
          <h2 className="section-title text-ink">Simple plans for every creative cadence.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className="space-y-5 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="ui-title text-ink">{plan.name}</h3>
                  <p className="text-sm text-ink-soft">Mock pricing for layout preview.</p>
                </div>
                <div
                  className={
                    plan.tone === "primary"
                      ? "rounded-2xl bg-accent-primary px-3 py-1.5 text-xs text-on-primary"
                      : plan.tone === "secondary"
                        ? "rounded-2xl bg-accent-secondary px-3 py-1.5 text-xs text-on-secondary"
                        : "rounded-2xl bg-surface-alt px-3 py-1.5 text-xs text-ink-soft"
                  }
                >
                  <span className="accent-type uppercase tracking-[0.14em]">
                    {plan.tone === "primary"
                      ? "Most Popular"
                      : plan.tone === "secondary"
                        ? "Team"
                        : "Entry"}
                  </span>
                </div>
              </div>
              <p className="text-3xl font-semibold text-ink">
                {plan.price}
                <span className="ml-1 text-sm font-medium text-ink-muted">{plan.cadence}</span>
              </p>
              <div className="grid gap-2">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-xl bg-surface-alt px-4 py-2.5 text-sm text-ink-soft">
                    {point}
                  </div>
                ))}
              </div>
              <Link
                to={plan.tone === "primary" ? "/ad-graphics" : "/product-shoots"}
                className={
                  plan.tone === "primary"
                    ? "button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
                    : "button button--secondary rounded-2xl px-5 py-2.5 text-sm font-semibold"
                }
              >
                {plan.tone === "primary" ? "Choose Scale" : "Start Free"}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-16">
        <Card className="space-y-6 bg-accent-highlight-soft p-6 sm:p-8">
          <div className="space-y-3">
            <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink">
              Launch Workflows
            </p>
            <h2 className="section-title max-w-[18ch] text-ink">
              Move from brief to ready-to-review visual requests fast.
            </h2>
            <p className="max-w-[58ch] text-sm text-ink-soft sm:text-base">
              Keep your process structured with guided steps, consistent validation, and preserved
              drafts across Product Shoots and Ad Graphics routes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/product-shoots"
              className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Open Product Shoots
            </Link>
            <Link
              to="/ad-graphics"
              className="button button--secondary rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Open Ad Graphics
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}
