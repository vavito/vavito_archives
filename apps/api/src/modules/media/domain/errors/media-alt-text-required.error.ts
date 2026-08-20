export const MEDIA_ALT_TEXT_REQUIRED = 'MEDIA_ALT_TEXT_REQUIRED';

export class MediaAltTextRequiredError extends Error {
  readonly code = MEDIA_ALT_TEXT_REQUIRED;

  constructor() {
    super('Media alt text is required.');
    this.name = MediaAltTextRequiredError.name;
  }
}
