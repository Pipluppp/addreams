import { useAtom } from "jotai";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import { ArrowLeft, X } from "lucide-react";
import { ProductShootsEntryCards } from "../../components/organisms/product-shoots/ProductShootsEntryCards";
import { GuidedComposePanel } from "../../components/organisms/product-shoots/GuidedComposePanel";
import { TemplatePickerPanel } from "../../components/organisms/product-shoots/TemplatePickerPanel";
import { ProductShootsResultsGallery } from "../../components/organisms/product-shoots/ProductShootsResultsGallery";
import { SingleImageEditorPanel } from "../../components/organisms/product-shoots/SingleImageEditorPanel";
import {
  defaultProductShootsValues,
  productShootsAspectRatioAtom,
  productShootsEditorPromptAtom,
  productShootsFormAtom,
  productShootsLastSuccessAtom,
  productShootsOutputsAtom,
  productShootsReferenceAtom,
  productShootsSelectedOutputIdAtom,
  productShootsStudioStateAtom,
  productShootsTemplateSelectionAtom,
  type ProductShootsOutputItem,
} from "../../features/product-shoots/state";
import { PRODUCT_SHOOTS_ASPECT_RATIOS, getAspectRatioOption } from "../../features/product-shoots/aspect-ratios";
import {
  PRODUCT_SHOOTS_TEMPLATE_CAP,
  PRODUCT_SHOOTS_TEMPLATES,
  composeTemplateShotPrompt,
  getTemplateById,
  groupTemplatesByCategory,
  toggleTemplateSelection,
} from "../../features/product-shoots/templates";
import { validateProductShootsForm } from "../../features/product-shoots/schema";
import {
  canRegenerateSingleImage,
  transitionProductShootsState,
} from "../../features/product-shoots/studio-machine";
import { useProductShootsMutation } from "../../features/product-shoots/use-product-shoots-mutation";
import {
  ApiError,
  getWorkflowOutputImages,
  isWorkflowCompletedResponse,
  type WorkflowOutputImage,
  type WorkflowResponse,
} from "../../lib/api";
import { useSession } from "../../lib/auth-client";
import { fileToDataUrl, validateReferenceImageFile } from "../../lib/image-validation";
import { fetchMe, meQueryKey, type MeResponse } from "../../lib/me";

const TEMPLATE_CATALOG_QUERY_KEY = ["product-shoots", "template-catalog"] as const;

function mapWorkflowImages(
  images: WorkflowOutputImage[],
  source: ProductShootsOutputItem["source"],
  labelBase?: string,
): ProductShootsOutputItem[] {
  return images.map((image, index) => ({
    id: crypto.randomUUID(),
    url: image.url,
    source,
    label: labelBase ? (images.length > 1 ? `${labelBase} ${index + 1}` : labelBase) : source === "guided" ? `Output ${index + 1}` : `Edit ${index + 1}`,
  }));
}

export default function ProductShootsRoute() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useAtom(productShootsFormAtom);
  const [studioState, setStudioState] = useAtom(productShootsStudioStateAtom);
  const [referenceDraft, setReferenceDraft] = useAtom(productShootsReferenceAtom);
  const [selectedTemplateIds, setSelectedTemplateIds] = useAtom(productShootsTemplateSelectionAtom);
  const [outputs, setOutputs] = useAtom(productShootsOutputsAtom);
  const [selectedOutputId, setSelectedOutputId] = useAtom(productShootsSelectedOutputIdAtom);
  const [editorPrompt, setEditorPrompt] = useAtom(productShootsEditorPromptAtom);
  const [aspectRatioId, setAspectRatioId] = useAtom(productShootsAspectRatioAtom);
  const [lastSuccess, setLastSuccess] = useAtom(productShootsLastSuccessAtom);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceError, setReferenceError] = useState<string | undefined>(undefined);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [isTemplateBatchPending, setIsTemplateBatchPending] = useState(false);
  const [pendingTemplateLabels, setPendingTemplateLabels] = useState<string[]>([]);

  const mutation = useProductShootsMutation();
  const isBusy = mutation.isPending || isTemplateBatchPending;
  const { data: session, isPending: isSessionPending } = useSession();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: !!session,
  });

  const templateCatalogQuery = useQuery({
    queryKey: TEMPLATE_CATALOG_QUERY_KEY,
    queryFn: async () => PRODUCT_SHOOTS_TEMPLATES,
  });

  useEffect(() => {
    if (!referenceDraft.imageFile) {
      setUploadPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(referenceDraft.imageFile);
    setUploadPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [referenceDraft.imageFile]);

  const remainingCredits = profileData?.profile.creditsProductShoots ?? 0;
  const isOutOfCredits = false;
  const hasLowCredits = false;

  const referencePreviewUrl = uploadPreviewUrl;

  const selectedAspectRatio = getAspectRatioOption(aspectRatioId);
  const aspectRatioOptions = PRODUCT_SHOOTS_ASPECT_RATIOS.map((option) => ({
    id: option.id,
    label: option.label,
  }));

  const selectedTemplates = selectedTemplateIds
    .map((templateId) => getTemplateById(templateId))
    .filter((template): template is NonNullable<typeof template> => Boolean(template));

  const selectedTemplateLabels = selectedTemplates.map((template) => template.label);

  const templateSections = useMemo(
    () => groupTemplatesByCategory(templateCatalogQuery.data ?? []),
    [templateCatalogQuery.data],
  );

  const hasValidReference = Boolean(referenceDraft.imageFile);
  const canContinueToWorkspace = hasValidReference && selectedTemplateIds.length > 0 && !isBusy;

  const selectedOutput = outputs.find((output) => output.id === selectedOutputId) ?? outputs[0] ?? null;

  const canGenerateFromSelectedOutput = canRegenerateSingleImage({
    isPending: isBusy,
    isOutOfCredits: false,
    selectedImageUrl: selectedOutput?.url ?? null,
    editPrompt: editorPrompt,
  });

  function openGuidedComposer() {
    setSubmitError(null);
    setStudioState(transitionProductShootsState(studioState, "START_GUIDED"));
  }

  function openTemplatePicker() {
    setStudioState("template-picker");
  }

  function closeTemplatePicker() {
    setStudioState("guided-compose");
  }

  function openEditorForImage(outputId: string) {
    setSelectedOutputId(outputId);
    setStudioState("edit-single");
  }

  function handleReferenceFileSelected(file: File) {
    const result = validateReferenceImageFile(file);
    if (!result.valid) {
      setReferenceError(result.error);
      return;
    }

    setReferenceError(undefined);
    setReferenceDraft((current) => ({
      ...current,
      mode: "upload",
      imageFile: file,
    }));
  }

  async function handleGenerateFromTemplates() {
    if (isSessionPending || !session || isBusy) {
      return;
    }

    if (!hasValidReference || !referenceDraft.imageFile) {
      setReferenceError("Select an image file to continue.");
      return;
    }

    if (selectedTemplateIds.length === 0) {
      setSubmitError("Select at least one template.");
      return;
    }

    setReferenceError(undefined);
    setSubmitError(null);
    setStudioState("edit-single");
    setOutputs([]);
    setSelectedOutputId(null);
    setEditorPrompt("");

    let referenceImageUrl: string;
    try {
      referenceImageUrl = await fileToDataUrl(referenceDraft.imageFile);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to read the selected image.");
      return;
    }

    const generatedOutputs: ProductShootsOutputItem[] = [];
    let lastResult: typeof lastSuccess = null;
    let terminalError: string | null = null;
    const queuedLabels = selectedTemplates.map((template) => template.label);
    setPendingTemplateLabels(queuedLabels);

    setIsTemplateBatchPending(true);

    try {
      for (const template of selectedTemplates) {

        const payloadValues = {
          ...formValues,
          prompt: composeTemplateShotPrompt(template),
          size: selectedAspectRatio.size,
          referenceImageUrl,
        };
        const validation = validateProductShootsForm(payloadValues);
        if (!validation.isValid) {
          const firstError = Object.values(validation.errors).find(Boolean);
          throw new Error(firstError ?? "Please resolve validation errors before submitting.");
        }

        try {
          const result = await mutation.mutateAsync(payloadValues);
          const nextOutputs = mapWorkflowImages(
            getWorkflowOutputImages(result.response),
            "guided",
            template.label,
          );

          generatedOutputs.push(...nextOutputs);
          lastResult = result;
          syncCredits(queryClient, result.response, profileData);

          if (nextOutputs.length > 0) {
            setOutputs((current) => [...current, ...nextOutputs]);
            setSelectedOutputId((current) => current ?? nextOutputs[0]?.id ?? null);
          }
        } catch (error) {
          if (!terminalError) {
            if (error instanceof ApiError && error.code === "OUT_OF_CREDITS") {
              terminalError = "You are out of Product Shoots credits.";
            } else {
              terminalError = error instanceof Error ? error.message : "Request failed.";
            }
          }

          if (error instanceof ApiError && error.code === "OUT_OF_CREDITS") {
            break;
          }
        } finally {
          setPendingTemplateLabels((current) => {
            const index = current.indexOf(template.label);
            if (index < 0) {
              return current;
            }
            return [...current.slice(0, index), ...current.slice(index + 1)];
          });
        }
      }
    } finally {
      setIsTemplateBatchPending(false);
    }

    if (terminalError) {
      setSubmitError(terminalError);
    }

    if (!generatedOutputs.length) {
      if (!terminalError) {
        setSubmitError("No images were returned. Try different templates.");
      }
      return;
    }

    setLastSuccess(lastResult);
    setSelectedOutputId((current) => current ?? generatedOutputs[0]?.id ?? null);
  }

  function handleGenerateFromSelectedOutput() {
    if (isSessionPending || !session || isBusy) {
      return;
    }

    if (!selectedOutput?.url) {
      setSubmitError("Select a generated image to continue.");
      return;
    }

    if (!editorPrompt.trim()) {
      setSubmitError("Enter a prompt.");
      return;
    }

    setSubmitError(null);

    const payloadValues = {
      ...formValues,
      prompt: editorPrompt.trim(),
      size: selectedAspectRatio.size,
      referenceImageUrl: selectedOutput.url,
    };
    const validation = validateProductShootsForm(payloadValues);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors).find(Boolean);
      setSubmitError(firstError ?? "Please resolve validation errors before submitting.");
      return;
    }

    mutation.mutate(payloadValues, {
      onSuccess: (result) => {
        const nextOutputs = mapWorkflowImages(
          getWorkflowOutputImages(result.response),
          "edit",
        );
        setLastSuccess(result);
        setOutputs((current) => [...current, ...nextOutputs]);
        setSelectedOutputId(nextOutputs[0]?.id ?? selectedOutput.id);
        syncCredits(queryClient, result.response, profileData);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "OUT_OF_CREDITS") {
          setSubmitError("You are out of Product Shoots credits.");
          return;
        }
        setSubmitError(error instanceof Error ? error.message : "Request failed.");
      },
    });
  }

  function handleTemplateToggle(templateId: string) {
    setSelectedTemplateIds((current) =>
      toggleTemplateSelection(current, templateId, PRODUCT_SHOOTS_TEMPLATE_CAP),
    );
  }

  function handleRemoveOutput(outputId: string) {
    setOutputs((current) => {
      const next = current.filter((output) => output.id !== outputId);
      if (!next.length) {
        setSelectedOutputId(null);
        return next;
      }

      if (selectedOutputId === outputId) {
        setSelectedOutputId(next[0]?.id ?? null);
      }

      return next;
    });
  }

  function handleDownloadImage(imageId: string) {
    const output = outputs.find((item) => item.id === imageId);
    if (!output) {
      return;
    }

    window.open(output.url, "_blank", "noopener,noreferrer");
  }

  function handleDownloadAll() {
    for (const output of outputs) {
      window.open(output.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleResetDraft() {
    setFormValues(defaultProductShootsValues);
    setReferenceDraft({ mode: "upload", imageUrl: "", imageFile: null });
    setSelectedTemplateIds([]);
    setOutputs([]);
    setSelectedOutputId(null);
    setEditorPrompt("");
    setAspectRatioId("story");
    setSubmitError(null);
    setReferenceError(undefined);
    setPendingTemplateLabels([]);
    setStudioState("entry");
  }

  function handleBack() {
    if (studioState === "entry") {
      navigate("/");
      return;
    }

    if (studioState === "guided-compose") {
      setStudioState("entry");
      return;
    }

    if (studioState === "template-picker") {
      setStudioState("guided-compose");
      return;
    }

    if (studioState === "edit-single") {
      if (outputs.length > 0) {
        setStudioState("guided-results");
      } else {
        setStudioState("guided-compose");
      }
      return;
    }

    if (studioState === "guided-results") {
      setStudioState("edit-single");
    }
  }

  const isTemplateModalOpen = studioState === "template-picker";

  return (
    <div className="min-h-full">
      <div className="container-shell space-y-4 py-5 sm:py-7">
        <div className="flex items-center justify-between">
          <Button
            isIconOnly
            type="button"
            variant="ghost"
            onPress={handleBack}
            aria-label="Back"
            className="rounded-full border border-studio-border bg-studio-surface-alt"
          >
            <ArrowLeft className="size-6" aria-hidden="true" />
          </Button>
          <Button
            isIconOnly
            type="button"
            variant="ghost"
            onPress={handleResetDraft}
            aria-label="Close"
            className="rounded-full border border-studio-border bg-studio-surface-alt"
          >
            <X className="size-6" aria-hidden="true" />
          </Button>
        </div>

        {studioState === "entry" ? (
          <section className="space-y-4">
            <h1 className="section-title text-studio-text">Photoshoot</h1>
            <p className="max-w-xl text-sm text-studio-text-muted">
              Create product visuals from one image using reusable templates.
            </p>
            <ProductShootsEntryCards
              onStartGuided={openGuidedComposer}
              onStartFlexible={() => navigate("/ad-graphics")}
            />
          </section>
        ) : null}

        {(studioState === "guided-compose" || isTemplateModalOpen) ? (
          <GuidedComposePanel
            referencePreviewUrl={referencePreviewUrl}
            referenceError={referenceError}
            remainingCredits={remainingCredits}
            hasLowCredits={hasLowCredits}
            isOutOfCredits={isOutOfCredits}
            selectedTemplates={selectedTemplates}
            selectedTemplateCount={selectedTemplateIds.length}
            maxTemplateCount={PRODUCT_SHOOTS_TEMPLATE_CAP}
            aspectRatioId={aspectRatioId}
            aspectRatioOptions={aspectRatioOptions}
            isPending={isBusy}
            canContinue={canContinueToWorkspace}
            onReferenceFileSelected={handleReferenceFileSelected}
            onClearReference={() => {
              setReferenceDraft((current) => ({ ...current, imageFile: null }));
              setReferenceError(undefined);
            }}
            onOpenTemplatePicker={openTemplatePicker}
            onAspectRatioChange={(value) => setAspectRatioId(value as typeof aspectRatioId)}
            onBackToEntry={() => setStudioState("entry")}
            onContinueToWorkspace={() => void handleGenerateFromTemplates()}
          />
        ) : null}

        <TemplatePickerPanel
          isOpen={isTemplateModalOpen}
          onOpenChange={(next) => {
            if (!next) {
              closeTemplatePicker();
            }
          }}
          sections={templateSections}
          selectedTemplateIds={selectedTemplateIds}
          maxTemplateCount={PRODUCT_SHOOTS_TEMPLATE_CAP}
          onToggleTemplate={handleTemplateToggle}
          onDone={closeTemplatePicker}
        />

        {studioState === "edit-single" ? (
          <SingleImageEditorPanel
            sourceImageUrl={referencePreviewUrl}
            selectedTemplateLabels={selectedTemplateLabels}
            outputs={outputs}
            selectedOutputId={selectedOutputId}
            editPrompt={editorPrompt}
            aspectRatioId={aspectRatioId}
            aspectRatioOptions={aspectRatioOptions}
            isPending={isBusy}
            canGenerate={canGenerateFromSelectedOutput}
            error={submitError}
            pendingIterationLabels={pendingTemplateLabels}
            onSelectOutput={setSelectedOutputId}
            onEditPromptChange={setEditorPrompt}
            onAspectRatioChange={(value) => setAspectRatioId(value as typeof aspectRatioId)}
            onGenerate={handleGenerateFromSelectedOutput}
            onDownload={() => {
              if (!selectedOutput) {
                return;
              }
              window.open(selectedOutput.url, "_blank", "noopener,noreferrer");
            }}
          />
        ) : null}

        {studioState === "guided-results" ? (
          <ProductShootsResultsGallery
            outputs={outputs}
            selectedOutputId={selectedOutputId}
            contextImageUrl={referencePreviewUrl}
            selectedTemplateLabels={selectedTemplateLabels}
            selectedTemplates={selectedTemplates}
            prompt={lastSuccess?.payload.prompt ?? ""}
            disableActions={mutation.isPending}
            onSelectOutput={setSelectedOutputId}
            onEditOutput={openEditorForImage}
            onDownloadOutput={handleDownloadImage}
            onRemoveOutput={handleRemoveOutput}
            onCreateCampaign={() => navigate("/ad-graphics")}
            onAddAll={() => window.alert("Added all outputs to Business DNA queue (UI placeholder).")}
            onDownloadAll={handleDownloadAll}
            onContinueGenerating={() => setStudioState("edit-single")}
          />
        ) : null}
      </div>
    </div>
  );
}

function syncCredits(
  queryClient: ReturnType<typeof useQueryClient>,
  response: WorkflowResponse,
  current: MeResponse | undefined,
) {
  if (!isWorkflowCompletedResponse(response) || !current) {
    return;
  }

  queryClient.setQueryData<MeResponse>(meQueryKey, {
    ...current,
    profile: {
      ...current.profile,
      creditsProductShoots: response.credits.productShoots,
      creditsAdGraphics: response.credits.adGraphics,
    },
  });
}
