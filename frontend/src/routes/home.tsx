import { Link } from "react-router-dom";
import { Frame } from "../components/atoms/Frame";
import { PillButton } from "../components/atoms/PillButton";
import { SquircleSurface } from "../components/atoms/SquircleSurface";

const capabilityCards = [
  {
    title: "Text-to-Image Ad Graphics",
    body: "Generate campaign-ready visuals directly from a creative brief with clean, structured controls.",
    image: "/mvp/text-to-product.png",
    width: 2874,
    height: 1618,
    accent: "primary" as const,
  },
  {
    title: "Reference-Based Product Shoots",
    body: "Upload or link a product image and direct exact edits for rapid shoot-style iteration.",
    image: "/mvp/product-reference-shoot.png",
    width: 2854,
    height: 1617,
    accent: "secondary" as const,
  },
  {
    title: "Step-Gated Workflows",
    body: "Progressive, validated steps keep teams focused on quality while preserving every draft edit.",
    image: "/mvp/product-reference-social.png",
    width: 2474,
    height: 1515,
    accent: "highlight" as const,
  },
  {
    title: "Model-Compatible Parameters",
    body: "Requests stay structured and consistent from first draft to final iteration.",
    image: "/mvp/text-to-product.png",
    width: 2874,
    height: 1618,
    accent: "primary" as const,
  },
] as const;

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
        <Frame className="overflow-hidden p-6 sm:p-8 lg:p-10">
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
                <PillButton tone="primary" asChild>
                  <Link to="/product-shoots">Start Product Shoots</Link>
                </PillButton>
                <PillButton tone="secondary" asChild>
                  <Link to="/ad-graphics">Start Ad Graphics</Link>
                </PillButton>
              </div>
            </div>

            <Frame className="space-y-5 bg-surface-alt p-6 sm:p-7">
              <p className="max-w-[42ch] text-sm leading-relaxed text-ink-soft">
                Built for teams who need clean outputs, reusable settings, and fast creative
                iteration across both workflows.
              </p>
              <div className="grid gap-3 text-sm">
                <SquircleSurface asChild radius="xxl" smooth="xl">
                  <div className="bg-surface px-5 py-3.5 text-ink">Creative Brief</div>
                </SquircleSurface>
                <SquircleSurface asChild radius="xxl" smooth="xl">
                  <div className="bg-surface px-5 py-3.5 text-ink">Inputs + Controls</div>
                </SquircleSurface>
                <SquircleSurface asChild radius="xxl" smooth="xl">
                  <div className="bg-surface px-5 py-3.5 text-ink">Review + Generate</div>
                </SquircleSurface>
                <SquircleSurface asChild radius="xxl" smooth="xl">
                  <div className="bg-surface px-5 py-3.5 text-ink">Result + Iterate</div>
                </SquircleSurface>
              </div>
            </Frame>
          </div>
        </Frame>
      </section>

      <section className="container-shell pb-7 sm:pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {proofStats.map((item) => (
            <Frame key={item.label} className="p-4">
              <p className="accent-type text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{item.value}</p>
            </Frame>
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mb-6 space-y-2">
          <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink-muted">
            Capabilities
          </p>
          <h2 className="section-title text-ink">
            Product and Ad Graphics features built for conversion teams.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {capabilityCards.map((card) => (
            <Frame key={card.title} className="space-y-3 p-4">
              <img
                src={card.image}
                alt={card.title}
                width={card.width}
                height={card.height}
                loading="lazy"
                decoding="async"
                className="h-48 w-full object-cover sm:h-56"
              />
              <div className="space-y-2">
                <h3 className="ui-title text-ink">{card.title}</h3>
                <p className="text-sm text-ink-soft">{card.body}</p>
              </div>
              <SquircleSurface
                radius="xl"
                smooth="lg"
                className={
                  card.accent === "primary"
                    ? "inline-flex bg-accent-primary px-3 py-1 text-xs text-on-primary"
                    : card.accent === "secondary"
                      ? "inline-flex bg-accent-secondary px-3 py-1 text-xs text-on-secondary"
                      : "inline-flex bg-accent-highlight px-3 py-1 text-xs text-on-highlight"
                }
              >
                <span className="accent-type uppercase tracking-[0.14em]">Workflow Proof</span>
              </SquircleSurface>
            </Frame>
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mb-6 space-y-2">
          <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink-muted">Pricing</p>
          <h2 className="section-title text-ink">Simple plans for every creative cadence.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Frame key={plan.name} className="space-y-5 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="ui-title text-ink">{plan.name}</h3>
                  <p className="text-sm text-ink-soft">Mock pricing for layout preview.</p>
                </div>
                <SquircleSurface
                  radius="xxl"
                  smooth="xl"
                  className={
                    plan.tone === "primary"
                      ? "bg-accent-primary px-3 py-1.5 text-xs text-on-primary"
                      : plan.tone === "secondary"
                        ? "bg-accent-secondary px-3 py-1.5 text-xs text-on-secondary"
                        : "bg-surface-alt px-3 py-1.5 text-xs text-ink-soft"
                  }
                >
                  <span className="accent-type uppercase tracking-[0.14em]">
                    {plan.tone === "primary"
                      ? "Most Popular"
                      : plan.tone === "secondary"
                        ? "Team"
                        : "Entry"}
                  </span>
                </SquircleSurface>
              </div>
              <p className="text-3xl font-semibold text-ink">
                {plan.price}
                <span className="ml-1 text-sm font-medium text-ink-muted">{plan.cadence}</span>
              </p>
              <div className="grid gap-2">
                {plan.points.map((point) => (
                  <SquircleSurface
                    key={point}
                    radius="xl"
                    smooth="lg"
                    className="bg-surface-alt px-4 py-2.5 text-sm text-ink-soft"
                  >
                    {point}
                  </SquircleSurface>
                ))}
              </div>
              <PillButton tone={plan.tone === "neutral" ? "secondary" : plan.tone} asChild>
                <Link to={plan.tone === "primary" ? "/ad-graphics" : "/product-shoots"}>
                  {plan.tone === "primary" ? "Choose Scale" : "Start Free"}
                </Link>
              </PillButton>
            </Frame>
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-16">
        <Frame className="space-y-6 bg-accent-highlight-soft p-6 sm:p-8">
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
            <PillButton tone="primary" asChild>
              <Link to="/product-shoots">Open Product Shoots</Link>
            </PillButton>
            <PillButton tone="secondary" asChild>
              <Link to="/ad-graphics">Open Ad Graphics</Link>
            </PillButton>
          </div>
        </Frame>
      </section>
    </>
  );
}
