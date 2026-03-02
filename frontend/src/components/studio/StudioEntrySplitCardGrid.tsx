import { Button, Card } from "@heroui/react";
import { cn } from "../../lib/cn";

type EntryCard = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
  emphasized?: boolean;
  disabled?: boolean;
  badge?: string;
  illustration?: {
    label: string;
    gradientFrom: string;
    gradientTo: string;
  };
};

type StudioEntrySplitCardGridProps = {
  cards: [EntryCard, EntryCard];
};

export function StudioEntrySplitCardGrid({ cards }: StudioEntrySplitCardGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => (
        <Card
          key={card.id}
          className={cn(
            "space-y-4 border border-studio-border bg-studio-surface p-5",
            card.emphasized && "ring-1 ring-studio-accent/60",
          )}
        >
          {card.illustration ? (
            <div
              className="relative h-40 overflow-hidden rounded-xl border border-studio-border"
              style={{
                backgroundImage: `linear-gradient(140deg, ${card.illustration.gradientFrom}, ${card.illustration.gradientTo})`,
              }}
            >
              <div className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-ink">
                {card.illustration.label}
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/70 bg-white/60 p-3 text-xs text-ink">
                Placeholder preview panel
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {card.badge ? (
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
                {card.badge}
              </p>
            ) : null}
            <h3 className="ui-title text-studio-text">{card.title}</h3>
            <p className="text-sm text-studio-text-muted">{card.description}</p>
          </div>
          <Button
            type="button"
            variant={card.emphasized ? "primary" : "secondary"}
            onPress={card.onPress}
            isDisabled={card.disabled}
          >
            {card.actionLabel}
          </Button>
        </Card>
      ))}
    </div>
  );
}
