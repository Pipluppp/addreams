import type { AdGraphicsSuccessRecord } from "../../features/ad-graphics/state";
import { getWorkflowOutputImages } from "../../lib/api";
import { FrameCanvas } from "../atoms/FrameCanvas";
import { ResultMetadataChips } from "../molecules/ResultMetadataChips";

type EditedImageResultFrameProps = {
  isPending: boolean;
  submitError: string | null;
  successRecord: AdGraphicsSuccessRecord | null;
};

export function EditedImageResultFrame({
  isPending,
  submitError,
  successRecord,
}: EditedImageResultFrameProps) {
  if (isPending) {
    return (
      <div aria-live="polite">
        <FrameCanvas label="Applying edit instructions to your reference image..." />
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
        <FrameCanvas label="No edits generated yet. Add an image and instruction to begin." />
      </div>
    );
  }

  const generatedImages = getWorkflowOutputImages(successRecord.response);

  return (
    <div className="space-y-4 bg-surface p-4">
      {generatedImages.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {generatedImages.map((image, index) => (
            <img
              key={`${image.url}-${index}`}
              src={image.url}
              alt={`Edited output ${index + 1}`}
              width={1400}
              height={1400}
              loading="lazy"
              decoding="async"
              className="h-auto max-h-72 w-full rounded-xl bg-canvas object-contain"
            />
          ))}
        </div>
      ) : (
        <FrameCanvas label="Generation completed but no images were returned." />
      )}
      <ResultMetadataChips response={successRecord.response} />
      <div className="bg-canvas p-3 text-xs text-muted">
        Validation summary: reference image present, instruction prompt present, and `n` forced to
        1.
      </div>
      <pre className="overflow-auto bg-canvas p-3 text-xs text-muted">
        {JSON.stringify(
          {
            referenceImageSource:
              successRecord.payload.referenceImageUrl.slice(0, 64) +
              (successRecord.payload.referenceImageUrl.length > 64 ? "..." : ""),
            parameters: successRecord.payload.parameters,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
