export const MEDIA_METADATA_INVALID = 'MEDIA_METADATA_INVALID';

export class MediaMetadataInvalidError extends Error {
  readonly code = MEDIA_METADATA_INVALID;

  constructor() {
    super('Media metadata is invalid.');
    this.name = MediaMetadataInvalidError.name;
  }
}
