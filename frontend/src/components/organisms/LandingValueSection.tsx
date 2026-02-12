import { Frame } from "../atoms/Frame";

const values = [
  {
    title: "Fewer controls, better outcomes",
    body: "Every parameter maps to documented Qwen fields so teams iterate fast without hidden knobs.",
  },
  {
    title: "Stub-safe by design",
    body: "Workflows run now against Hono stubs while preserving Qwen-ready payload shapes for later backend swap-in.",
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
        <Frame
          key={item.title}
          className="p-5 animate-reveal-rise"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <h3 className="font-display text-2xl leading-tight text-ink">{item.title}</h3>
          <p className="mt-3 text-sm text-muted">{item.body}</p>
        </Frame>
      ))}
    </div>
  );
}
