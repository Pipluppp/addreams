export function focusFirstError<Field extends string>(
  errors: Partial<Record<Field, string>>,
  fieldToElementId: Record<Field, string>,
) {
  const firstField = Object.keys(errors).find((key) => Boolean(errors[key as Field])) as
    | Field
    | undefined;

  if (!firstField) {
    return;
  }

  const elementId = fieldToElementId[firstField];
  const element = document.getElementById(elementId);
  if (element instanceof HTMLElement) {
    element.focus();
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
