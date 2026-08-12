/** Звёздочка у лейбла обязательного поля. aria-hidden: обязательность озвучивает сам required. */
export function RequiredMark() {
  return <span className="admin-form-field__required" aria-hidden="true"> *</span>;
}
