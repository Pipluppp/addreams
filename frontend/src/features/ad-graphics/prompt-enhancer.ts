/**
 * Prompt enhancement stub.
 *
 * Future: call `POST /api/enhance-prompt` to refine casual prompts
 * into structured model instructions via a lightweight LLM.
 * For now this is a passthrough.
 */
export async function enhancePrompt(prompt: string): Promise<string> {
  return prompt;
}
