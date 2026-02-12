import { Frame } from "../atoms/Frame";

const examples = [
  {
    src: "/mvp/text-to-product.png",
    alt: "Product shoot generated from text prompt",
    label: "Product Shoots",
    width: 2874,
    height: 1618,
  },
  {
    src: "/mvp/product-reference-shoot.png",
    alt: "Edited product image workflow example",
    label: "Ad Graphics",
    width: 2854,
    height: 1617,
  },
  {
    src: "/mvp/product-reference-social.png",
    alt: "Social graphic variant generation example",
    label: "Campaign Variants",
    width: 2474,
    height: 1515,
  },
] as const;

export function LandingProofSection() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr]">
      <Frame className="p-4 md:row-span-2 animate-reveal-rise">
        <img
          src={examples[0].src}
          alt={examples[0].alt}
          width={examples[0].width}
          height={examples[0].height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {examples[0].label}
        </p>
      </Frame>

      <Frame className="p-4 animate-reveal-rise [animation-delay:80ms]">
        <img
          src={examples[1].src}
          alt={examples[1].alt}
          width={examples[1].width}
          height={examples[1].height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {examples[1].label}
        </p>
      </Frame>

      <Frame className="p-4 animate-reveal-rise [animation-delay:160ms]">
        <img
          src={examples[2].src}
          alt={examples[2].alt}
          width={examples[2].width}
          height={examples[2].height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {examples[2].label}
        </p>
      </Frame>
    </div>
  );
}
