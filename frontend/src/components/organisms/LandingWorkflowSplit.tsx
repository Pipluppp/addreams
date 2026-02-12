import { Link } from "react-router-dom";
import { Frame } from "../atoms/Frame";

const cards = [
  {
    title: "Product Shoots",
    description:
      "Start from text only. Set size, seed, prompt rewrite behavior, and output format for fresh product compositions.",
    href: "/product-shoots",
  },
  {
    title: "Ad Graphics",
    description:
      "Bring a reference image, specify exact edit instructions, and iterate campaign variants quickly.",
    href: "/ad-graphics",
  },
] as const;

export function LandingWorkflowSplit() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cards.map((card, index) => (
        <Frame
          key={card.title}
          className="group flex h-full flex-col justify-between p-6 transition-colors duration-200 hover:bg-surface-alt animate-reveal-rise"
          style={{ animationDelay: `${index * 90 + 80}ms` }}
        >
          <div>
            <h2 className="font-display text-3xl leading-tight text-ink">{card.title}</h2>
            <p className="mt-3 text-sm text-muted">{card.description}</p>
          </div>
          <Link
            to={card.href}
            className="mt-8 inline-flex w-fit bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-200 group-hover:bg-accent-highlight-soft group-hover:text-accent-primary"
          >
            Open workflow
          </Link>
        </Frame>
      ))}
    </div>
  );
}
