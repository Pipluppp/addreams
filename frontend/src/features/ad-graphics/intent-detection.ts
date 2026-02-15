export type IntentWarning = {
  id: string;
  message: string;
};

type IntentRule = {
  id: string;
  pattern: RegExp;
  message: string;
};

const INTENT_RULES: IntentRule[] = [
  {
    id: "background-removal",
    pattern: /\b(remove|delete|erase)\b.*\b(background|bg)\b/i,
    message:
      "Background removal often creates halos and artifacts. Try describing a new background instead.",
  },
  {
    id: "face-swap",
    pattern: /\b(swap|replace|change)\b.*\bface\b/i,
    message: "Face swapping doesn't reliably preserve identity.",
  },
  {
    id: "canvas-extension",
    pattern: /\b(extend|expand|outpaint)\b.*\b(canvas|image|frame)\b/i,
    message:
      "Canvas extension is unreliable. Start with a fully-framed image instead.",
  },
  {
    id: "rotation",
    pattern: /\b(rotate|tilt)\b.*\b(perspective|angle|view|camera)\b/i,
    message:
      "Rotational angle changes are less reliable. Try describing a top-down or eye-level view instead.",
  },
];

export function detectIntentWarnings(prompt: string): IntentWarning[] {
  if (!prompt.trim()) {
    return [];
  }

  const warnings: IntentWarning[] = [];
  for (const rule of INTENT_RULES) {
    if (rule.pattern.test(prompt)) {
      warnings.push({ id: rule.id, message: rule.message });
    }
  }
  return warnings;
}
