export function isAdminResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function adminPageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function isCampaignText(subject: unknown, previewText: unknown): boolean {
  return (
    typeof subject === 'string' &&
    subject.trim().length > 0 &&
    subject.length <= 255 &&
    typeof previewText === 'string' &&
    previewText.length <= 255
  );
}
