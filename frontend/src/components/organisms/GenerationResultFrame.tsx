import type { ProductShootsSuccessRecord } from "../../features/product-shoots/state";
import { getWorkflowOutputImages } from "../../lib/api";
import { FrameCanvas } from "../atoms/FrameCanvas";
import { ResultMetadataChips } from "../molecules/ResultMetadataChips";

type GenerationResultFrameProps = {
  isPending: boolean;
  submitError: string | null;
  successRecord: ProductShootsSuccessRecord | null;
};

export function GenerationResultFrame({
  isPending,
  submitError,
  successRecord,
}: GenerationResultFrameProps) {
  if (isPending) {
    return (
      <div aria-live="polite">
        <FrameCanvas label="Composing your product shoot output…" />
      </div>
    );
  }

  if (submitError) {
    return (
      <div className="bg-surface p-4">
        <p className="text-sm font-medium text-error" role="alert">
          {submitError}
        </p>
      </div>
    );
  }

  if (!successRecord) {
    return (
      <div aria-live="polite">
        <FrameCanvas label="No generations yet. Submit a prompt to create your first frame." />
      </div>
    );
  }

  const firstImage = getWorkflowOutputImages(successRecord.response)[0];

  return (
    <div className="space-y-4 bg-surface p-4">
      {firstImage ? (
        <img
          src={firstImage.url}
          alt="Generated product shoot output"
          width={1400}
          height={1400}
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[26rem] w-full rounded-xl bg-canvas object-contain"
        />
      ) : (
        <FrameCanvas label="Generation completed but no images were returned." />
      )}
      <ResultMetadataChips response={successRecord.response} />
      <pre className="overflow-auto bg-canvas p-3 text-xs text-muted">
        {JSON.stringify(successRecord.payload.parameters, null, 2)}
      </pre>
    </div>
  );
}
