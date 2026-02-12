import { FrameCanvas } from "../atoms/FrameCanvas";

export function RouteLoadingFrame({ label }: { label: string }) {
  return (
    <section className="container-shell py-10">
      <FrameCanvas label={label} />
    </section>
  );
}
