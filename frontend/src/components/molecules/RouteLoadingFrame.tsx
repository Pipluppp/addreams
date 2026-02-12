import { FrameCanvas } from "../atoms/FrameCanvas";

export function RouteLoadingFrame({ label }: { label: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <FrameCanvas label={label} />
    </section>
  );
}
