import { Card } from "@heroui/react";

const values = [
  {
    title: "Fewer controls, better outcomes",
    body: "Every parameter is explicit so teams iterate fast without hidden knobs.",
  },
  {
    title: "Stub-safe by design",
    body: "Workflows run against stable stubs while keeping request payloads clean and predictable.",
  },
  {
    title: "Craft-led visual system",
    body: "Editorial frames, sharp type, and a single accent color keep focus on the output instead of UI noise.",
  },
] as const;

export function LandingValueSection() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {values.map((item, index) => (
        <Card
          key={item.title}
          className="p-5 animate-reveal-rise"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <h3 className="font-display text-2xl leading-tight text-ink">{item.title}</h3>
          <p className="mt-3 text-sm text-muted">{item.body}</p>
        </Card>
      ))}
    </div>
  );
}
