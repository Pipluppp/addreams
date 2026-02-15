import { Modal } from "@heroui/react";

type DemoGuideModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "product-shoot" | "ad-graphics";
};

const LAMP_PROMPT =
  "Graphic design layout for a social media ad featuring the provided IKEA BL\u00c5SVERK lamp. Center the lamp as the hero product. Place a large, crisp, perfect white circle directly behind the lamp to create a \u2018halo\u2019 effect and add depth. Use a solid matte sage-green background for the entire frame. At the top center, add a clean black IKEA logo. Below the logo, place the headline \u2018Retro Charm, Modern Glow\u2019 in bold, white, thick sans-serif typography. Add headlines";

const COOKIE_PROMPT =
  "A hyper-realistic, high-speed commercial food photograph of a thick, gourmet chocolate chip cookie being dunked into a glass of cold milk. Captured at the exact moment of impact, a dramatic white milk splash crown rises around the cookie. Suspended milk droplets and ripples are frozen in mid-air.The cookie features large, melty dark chocolate chunks and a golden-brown, rugged texture with visible salt flakes. Sharp focus on the cookie, soft-bokeh background";

function Arrow() {
  return (
    <div className="flex justify-center py-2 text-ink-muted">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
      {children}
    </p>
  );
}

export function DemoGuideModal({ isOpen, onOpenChange, variant }: DemoGuideModalProps) {
  const isProductShoot = variant === "product-shoot";

  return (
    <Modal.Backdrop variant="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="rounded-3xl sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {isProductShoot ? "Product Shoot Demo" : "Ad Graphics Demo"}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-1">
            {isProductShoot ? (
              <>
                {/* Step 1: Input image */}
                <div className="space-y-2 rounded-xl bg-surface-alt p-4">
                  <StepLabel>1. Input Image</StepLabel>
                  <img
                    src="/demo_guide/product-shoot/lamp_input.jpg"
                    alt="Lamp product input"
                    className="h-auto max-h-48 w-full rounded-lg object-contain"
                  />
                </div>
                <Arrow />
                {/* Step 2: Prompt */}
                <div className="space-y-2 rounded-xl bg-surface-alt p-4">
                  <StepLabel>2. Prompt</StepLabel>
                  <p className="text-xs leading-relaxed text-ink-soft">{LAMP_PROMPT}</p>
                </div>
                <Arrow />
                {/* Step 3: Generated */}
                <div className="space-y-2 rounded-xl bg-surface-alt p-4">
                  <StepLabel>3. Generated Output</StepLabel>
                  <img
                    src="/demo_guide/product-shoot/lamp_generated.png"
                    alt="Lamp generated ad"
                    className="h-auto max-h-56 w-full rounded-lg object-contain"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Step 1: Prompt */}
                <div className="space-y-2 rounded-xl bg-surface-alt p-4">
                  <StepLabel>1. Prompt</StepLabel>
                  <p className="text-xs leading-relaxed text-ink-soft">{COOKIE_PROMPT}</p>
                </div>
                <Arrow />
                {/* Step 2: Generated */}
                <div className="space-y-2 rounded-xl bg-surface-alt p-4">
                  <StepLabel>2. Generated Output</StepLabel>
                  <img
                    src="/demo_guide/ad-graphics/cookie.png"
                    alt="Cookie ad graphic"
                    className="h-auto max-h-56 w-full rounded-lg object-contain"
                  />
                </div>
              </>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
