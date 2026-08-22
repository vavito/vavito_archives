export const MEDIA_STORAGE_INCONSISTENT = 'MEDIA_STORAGE_INCONSISTENT';

export class MediaStorageInconsistentError extends Error {
  readonly code = MEDIA_STORAGE_INCONSISTENT;

  constructor() {
    super('Media asset state is inconsistent with its storage metadata.');
    this.name = MediaStorageInconsistentError.name;
  }
}
