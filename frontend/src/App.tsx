import { atom, useAtom } from "jotai";
import { FormEvent, useMemo, useState } from "react";

const apiBaseAtom = atom(import.meta.env.VITE_API_BASE_URL ?? "/api");

type StubResponse = {
  workflow: string;
  status: "stub";
  requestId: string;
  receivedAt: string;
};

type ErrorResponse = {
  error: string;
};

const defaultReferenceState = {
  prompt: "",
  referenceImageUrl: "",
};

async function postWorkflow<TBody extends Record<string, string>>(
  apiBase: string,
  route: string,
  body: TBody,
): Promise<StubResponse> {
  const response = await fetch(`${apiBase}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.error || "Request failed");
  }

  return (await response.json()) as StubResponse;
}

export default function App() {
  const [apiBase] = useAtom(apiBaseAtom);
  const [health, setHealth] = useState<string>("idle");
  const [textPrompt, setTextPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState(defaultReferenceState);
  const [videoReference, setVideoReference] = useState(defaultReferenceState);
  const [result, setResult] = useState<string>("");

  const apiInfo = useMemo(
    () => `API base: ${apiBase}. In local dev this defaults to /api and proxies to backend:8787.`,
    [apiBase],
  );

  async function checkHealth() {
    try {
      setHealth("checking...");
      const response = await fetch(`${apiBase}/health`);
      const data = (await response.json()) as { status: string; timestamp: string };
      setHealth(`${data.status} @ ${data.timestamp}`);
    } catch (error) {
      setHealth(error instanceof Error ? error.message : "Health check failed");
    }
  }

  async function submitTextWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await postWorkflow(apiBase, "/workflows/image-from-text", {
        prompt: textPrompt,
      });
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function submitReferenceWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await postWorkflow(apiBase, "/workflows/image-from-reference", referenceImage);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function submitVideoWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await postWorkflow(apiBase, "/workflows/video-from-reference", videoReference);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-black/60">Addreams</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          AI Ad Graphics and Product Shoots
        </h1>
        <p className="mt-3 max-w-3xl text-black/70">
          React/Vite SPA on Cloudflare Workers Assets with a separate Hono API Worker.
        </p>
        <p className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-zinc-100">{apiInfo}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Service Health</h2>
          <p className="mt-2 text-sm text-black/70">Checks `GET /api/health`</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
            onClick={checkHealth}
          >
            Check health
          </button>
          <p className="mt-3 text-sm text-black/70">{health}</p>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Image From Text</h2>
          <form className="mt-4 flex flex-col gap-3" onSubmit={submitTextWorkflow}>
            <textarea
              className="min-h-24 rounded-lg border border-black/15 px-3 py-2"
              placeholder="Prompt"
              value={textPrompt}
              onChange={(event) => setTextPrompt(event.target.value)}
            />
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white">
              Submit
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Image From Reference</h2>
          <form className="mt-4 flex flex-col gap-3" onSubmit={submitReferenceWorkflow}>
            <input
              className="rounded-lg border border-black/15 px-3 py-2"
              placeholder="Reference image URL"
              value={referenceImage.referenceImageUrl}
              onChange={(event) =>
                setReferenceImage((current) => ({
                  ...current,
                  referenceImageUrl: event.target.value,
                }))
              }
            />
            <textarea
              className="min-h-24 rounded-lg border border-black/15 px-3 py-2"
              placeholder="Prompt"
              value={referenceImage.prompt}
              onChange={(event) =>
                setReferenceImage((current) => ({ ...current, prompt: event.target.value }))
              }
            />
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white">
              Submit
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Video From Reference</h2>
          <form className="mt-4 flex flex-col gap-3" onSubmit={submitVideoWorkflow}>
            <input
              className="rounded-lg border border-black/15 px-3 py-2"
              placeholder="Reference image or video URL"
              value={videoReference.referenceImageUrl}
              onChange={(event) =>
                setVideoReference((current) => ({
                  ...current,
                  referenceImageUrl: event.target.value,
                }))
              }
            />
            <textarea
              className="min-h-24 rounded-lg border border-black/15 px-3 py-2"
              placeholder="Prompt"
              value={videoReference.prompt}
              onChange={(event) =>
                setVideoReference((current) => ({ ...current, prompt: event.target.value }))
              }
            />
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white">
              Submit
            </button>
          </form>
        </article>
      </section>

      <section className="rounded-2xl border border-black/10 bg-zinc-950 p-6 text-zinc-100 shadow-sm">
        <h2 className="text-lg font-semibold">Last API Response</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-4 text-xs">
          {result || "No calls yet."}
        </pre>
      </section>
    </main>
  );
}
