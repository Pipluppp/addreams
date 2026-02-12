import type { AdGraphicsSuccessRecord } from "../../features/ad-graphics/state";
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

  return (
    <div className="space-y-4 bg-surface p-4">
      <FrameCanvas label="Stub backend accepted request. Edited preview will appear after backend hookup." />
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
