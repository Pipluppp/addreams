import { useAtom } from "jotai";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMolecule } from "bunshi/react";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { ProductShootsEntryCards } from "../../components/organisms/product-shoots/ProductShootsEntryCards";
import { ProductShootGenerationsPanel } from "../../components/organisms/product-shoots/ProductShootGenerationsPanel";
import { GuidedComposePanel } from "../../components/organisms/product-shoots/GuidedComposePanel";
import { TemplatePickerPanel } from "../../components/organisms/product-shoots/TemplatePickerPanel";
import { SingleImageEditorPanel } from "../../components/organisms/product-shoots/SingleImageEditorPanel";
import {
  productShootsAspectRatioAtom,
  productShootsEditorPromptAtom,
  productShootsFormAtom,
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
  type ProductShootRunTemplate,
  type WorkflowOutputImage,
  type WorkflowResponse,
} from "../../lib/api";
import { useSession } from "../../lib/auth-client";
import { ApiClientMolecule } from "../../lib/dependencies";
import { fileToDataUrl, validateReferenceImageFile } from "../../lib/image-validation";
import { fetchMe, meQueryKey, type MeResponse } from "../../lib/me";

const TEMPLATE_CATALOG_QUERY_KEY = ["product-shoots", "template-catalog"] as const;
const SOURCE_IMAGE_SELECTION_ID = "__source__";

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
  const api = useMolecule(ApiClientMolecule);
  const [formValues] = useAtom(productShootsFormAtom);
  const [studioState, setStudioState] = useAtom(productShootsStudioStateAtom);
  const [referenceDraft, setReferenceDraft] = useAtom(productShootsReferenceAtom);
  const [selectedTemplateIds, setSelectedTemplateIds] = useAtom(productShootsTemplateSelectionAtom);
  const [outputs, setOutputs] = useAtom(productShootsOutputsAtom);
  const [selectedOutputId, setSelectedOutputId] = useAtom(productShootsSelectedOutputIdAtom);
  const [editorPrompt, setEditorPrompt] = useAtom(productShootsEditorPromptAtom);
  const [aspectRatioId, setAspectRatioId] = useAtom(productShootsAspectRatioAtom);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceError, setReferenceError] = useState<string | undefined>(undefined);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [isTemplateBatchPending, setIsTemplateBatchPending] = useState(false);
  const [pendingTemplateLabels, setPendingTemplateLabels] = useState<string[]>([]);
  const [openingRunId, setOpeningRunId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

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

  const generationRunsQuery = useQuery({
    queryKey: ["product-shoots", "runs", "entry"],
    queryFn: () => api.listProductShootRuns({ limit: 8, offset: 0 }),
    enabled: Boolean(session) && studioState === "entry",
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

  useEffect(() => {
    if (studioState === "guided-results") {
      setStudioState("entry");
    }
  }, [studioState, setStudioState]);

  const remainingCredits = profileData?.profile.creditsProductShoots ?? 0;
  const isOutOfCredits = false;
  const hasLowCredits = false;

  const referencePreviewUrl = uploadPreviewUrl ?? (referenceDraft.imageUrl.trim() || null);

  const generationRuns = useMemo(() => {
    const items = generationRunsQuery.data?.items ?? [];
    if (!activeRunId || !referencePreviewUrl) {
      return items;
    }

    return items.map((item) => {
      if (item.runId !== activeRunId || item.sourceImageUrl) {
        return item;
      }
      return { ...item, sourceImageUrl: referencePreviewUrl };
    });
  }, [generationRunsQuery.data?.items, activeRunId, referencePreviewUrl]);

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

  const hasValidReference = Boolean(referenceDraft.imageFile || referenceDraft.imageUrl.trim());
  const canContinueToWorkspace = hasValidReference && selectedTemplateIds.length > 0 && !isBusy;

  const selectedOutput = outputs.find((output) => output.id === selectedOutputId) ?? null;
  const isSourceSelected =
    selectedOutputId === SOURCE_IMAGE_SELECTION_ID ||
    (!selectedOutput && Boolean(referencePreviewUrl));
  const selectedEditableImageUrl = isSourceSelected
    ? referencePreviewUrl
    : (selectedOutput?.url ?? null);

  const canGenerateFromSelectedOutput = canRegenerateSingleImage({
    isPending: isBusy,
    isOutOfCredits: false,
    selectedImageUrl: selectedEditableImageUrl,
    editPrompt: editorPrompt,
  });

  function openGuidedComposer() {
    setSubmitError(null);
    setActiveRunId(null);
    setStudioState(transitionProductShootsState(studioState, "START_GUIDED"));
  }

  function openTemplatePicker() {
    setStudioState("template-picker");
  }

  function closeTemplatePicker() {
    setStudioState("guided-compose");
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
      imageUrl: "",
      imageFile: file,
    }));
    setActiveRunId(null);
  }

  async function handleGenerateFromTemplates() {
    if (isSessionPending || !session || isBusy) {
      return;
    }

    if (!hasValidReference) {
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

    let referenceImageUrl = referenceDraft.imageUrl.trim();
    if (referenceDraft.imageFile) {
      try {
        referenceImageUrl = await fileToDataUrl(referenceDraft.imageFile);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to read the selected image.");
        return;
      }
    }

    if (!referenceImageUrl) {
      setSubmitError("Select an image file to continue.");
      return;
    }

    const generatedOutputs: ProductShootsOutputItem[] = [];
    let terminalError: string | null = null;
    const queuedLabels = selectedTemplates.map((template) => template.label);
    const runId = activeRunId ?? crypto.randomUUID();
    setActiveRunId(runId);
    const selectedTemplateSnapshots: ProductShootRunTemplate[] = selectedTemplates.map((template) => ({
      id: template.id,
      label: template.label,
    }));
    setPendingTemplateLabels(queuedLabels);

    setIsTemplateBatchPending(true);

    try {
      for (const template of selectedTemplates) {

        const payloadValues = {
          ...formValues,
          prompt: composeTemplateShotPrompt(template),
          size: selectedAspectRatio.size,
          referenceImageUrl,
          productShootContext: {
            runId,
            templateId: template.id,
            templateLabel: template.label,
            selectedTemplates: selectedTemplateSnapshots,
            aspectRatioId,
          },
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
          syncCredits(queryClient, result.response, profileData);

          if (nextOutputs.length > 0) {
            setOutputs((current) => [...current, ...nextOutputs]);
            setSelectedOutputId((current) => current ?? nextOutputs[0]?.id ?? null);
            void queryClient.invalidateQueries({ queryKey: ["product-shoots", "runs"] });
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

    setSelectedOutputId(generatedOutputs[0]?.id ?? SOURCE_IMAGE_SELECTION_ID);
    await queryClient.invalidateQueries({ queryKey: ["product-shoots", "runs"] });
  }

  async function handleGenerateFromSelectedOutput() {
    if (isSessionPending || !session || isBusy) {
      return;
    }

    let referenceImageUrl = selectedEditableImageUrl;

    if (isSourceSelected) {
      if (referenceDraft.imageFile) {
        try {
          referenceImageUrl = await fileToDataUrl(referenceDraft.imageFile);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "Unable to read the selected image.");
          return;
        }
      } else if (referenceDraft.imageUrl.trim()) {
        referenceImageUrl = referenceDraft.imageUrl.trim();
      }
    }

    if (!referenceImageUrl) {
      setSubmitError("Select an image to continue.");
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
      referenceImageUrl,
      productShootContext: {
        runId: activeRunId ?? crypto.randomUUID(),
        templateId:
          selectedTemplates[0]?.id ??
          "manual-edit",
        templateLabel:
          selectedOutput?.label ||
          selectedTemplates[0]?.label ||
          "Manual Edit",
        selectedTemplates:
          selectedTemplates.length > 0
            ? selectedTemplates.map((template) => ({
                id: template.id,
                label: template.label,
              }))
            : [{ id: "manual-edit", label: "Manual Edit" }],
        aspectRatioId,
      },
    };
    const validation = validateProductShootsForm(payloadValues);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors).find(Boolean);
      setSubmitError(firstError ?? "Please resolve validation errors before submitting.");
      return;
    }

    mutation.mutate(payloadValues, {
      onSuccess: (result) => {
        setActiveRunId(payloadValues.productShootContext?.runId ?? null);
        const nextOutputs = mapWorkflowImages(
          getWorkflowOutputImages(result.response),
          "edit",
        );
        setOutputs((current) => [...current, ...nextOutputs]);
        setSelectedOutputId(nextOutputs[0]?.id ?? selectedOutputId ?? SOURCE_IMAGE_SELECTION_ID);
        syncCredits(queryClient, result.response, profileData);
        void queryClient.invalidateQueries({ queryKey: ["product-shoots", "runs"] });
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

  async function handleOpenGenerationRun(runId: string) {
    if (openingRunId || isBusy) {
      return;
    }

    setOpeningRunId(runId);
    try {
      const detail = await api.getProductShootRun(runId);
      const run = detail.item;

      const nextOutputs = run.outputs
        .filter((output): output is typeof output & { imageUrl: string } => Boolean(output.imageUrl))
        .map((output, index) => ({
          id: crypto.randomUUID(),
          url: output.imageUrl,
          source: "guided" as const,
          label: output.templateLabel || `Output ${index + 1}`,
        }));

      if (run.sourceImageUrl) {
        setReferenceDraft({
          mode: "upload",
          imageUrl: run.sourceImageUrl,
          imageFile: null,
        });
      } else if (run.runId === activeRunId && referenceDraft.imageFile) {
        setReferenceDraft({
          mode: "upload",
          imageUrl: "",
          imageFile: referenceDraft.imageFile,
        });
      } else if (run.runId === activeRunId && referenceDraft.imageUrl.trim()) {
        setReferenceDraft({
          mode: "upload",
          imageUrl: referenceDraft.imageUrl.trim(),
          imageFile: null,
        });
      } else {
        setReferenceDraft({
          mode: "upload",
          imageUrl: "",
          imageFile: null,
        });
      }
      setActiveRunId(run.runId);
      setSelectedTemplateIds(run.templates.map((template) => template.id));
      setOutputs(nextOutputs);
      setSelectedOutputId(nextOutputs[0]?.id ?? SOURCE_IMAGE_SELECTION_ID);
      setPendingTemplateLabels([]);
      setReferenceError(undefined);
      setSubmitError(null);
      setEditorPrompt("");
      if (run.aspectRatioId) {
        setAspectRatioId(run.aspectRatioId as typeof aspectRatioId);
      }
      setStudioState("edit-single");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to open this generation.");
    } finally {
      setOpeningRunId(null);
    }
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
      setStudioState("entry");
      return;
    }

    if (studioState === "guided-results") {
      setStudioState("entry");
    }
  }

  const isTemplateModalOpen = studioState === "template-picker";

  return (
    <div className="min-h-full">
      <div className="container-shell space-y-4 py-5 sm:py-7">
        <div className="flex items-center">
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
        </div>

        {studioState === "entry" ? (
          <section className="space-y-4">
            <h1 className="section-title text-studio-text">Product Shoots</h1>
            <p className="max-w-xl text-sm text-studio-text-muted">
              Create product visuals from one image using reusable templates.
            </p>
            <ProductShootsEntryCards
              onStartGuided={openGuidedComposer}
              onStartFlexible={() => navigate("/ad-graphics")}
            />
            <ProductShootGenerationsPanel
              items={generationRuns}
              isLoading={generationRunsQuery.isPending}
              isError={generationRunsQuery.isError}
              openingRunId={openingRunId}
              onOpenRun={(runId) => void handleOpenGenerationRun(runId)}
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
            onOpenTemplatePicker={openTemplatePicker}
            onAspectRatioChange={(value) => setAspectRatioId(value as typeof aspectRatioId)}
            onGenerate={() => void handleGenerateFromTemplates()}
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
            isSourceSelected={isSourceSelected}
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
            onSelectSource={() => setSelectedOutputId(SOURCE_IMAGE_SELECTION_ID)}
            onSelectOutput={setSelectedOutputId}
            onEditPromptChange={setEditorPrompt}
            onAspectRatioChange={(value) => setAspectRatioId(value as typeof aspectRatioId)}
            onGenerate={() => void handleGenerateFromSelectedOutput()}
            onDownload={() => {
              if (!selectedEditableImageUrl) {
                return;
              }
              window.open(selectedEditableImageUrl, "_blank", "noopener,noreferrer");
            }}
            onDeleteSelected={() => {
              if (!selectedOutput) {
                return;
              }
              handleRemoveOutput(selectedOutput.id);
            }}
            canDeleteSelected={!isSourceSelected && Boolean(selectedOutput)}
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
