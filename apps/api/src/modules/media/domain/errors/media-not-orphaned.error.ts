export const MEDIA_NOT_ORPHANED = 'MEDIA_NOT_ORPHANED';

export class MediaNotOrphanedError extends Error {
  readonly code = MEDIA_NOT_ORPHANED;

  constructor() {
    super('Media asset is not eligible for orphaning or purge.');
    this.name = MediaNotOrphanedError.name;
  }
}
