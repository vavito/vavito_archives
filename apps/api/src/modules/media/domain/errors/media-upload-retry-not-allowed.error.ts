export const MEDIA_UPLOAD_RETRY_NOT_ALLOWED = 'MEDIA_UPLOAD_RETRY_NOT_ALLOWED';

export class MediaUploadRetryNotAllowedError extends Error {
  readonly code = MEDIA_UPLOAD_RETRY_NOT_ALLOWED;

  constructor() {
    super('Media upload retry is allowed only for failed assets.');
    this.name = MediaUploadRetryNotAllowedError.name;
  }
}
