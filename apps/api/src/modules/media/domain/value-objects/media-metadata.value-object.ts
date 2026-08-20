import { MediaAltTextRequiredError } from '@api/modules/media/domain/errors/media-alt-text-required.error';
import { MediaMetadataInvalidError } from '@api/modules/media/domain/errors/media-metadata-invalid.error';

export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;

export const MEDIA_EXTENSIONS_BY_MIME_TYPE = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
} as const;

export type SupportedMediaMimeType = keyof typeof MEDIA_EXTENSIONS_BY_MIME_TYPE;

export interface MediaMetadataProps {
  altText: string;
  height: number | null;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  width: number | null;
}

const STORAGE_PATH_PATTERN =
  /^(?<year>\d{4})\/(?<month>0[1-9]|1[0-2])\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(?<extension>[a-z0-9]+)$/i;

function normalizeAltText(altText: string): string {
  const normalized = altText.trim().replaceAll(/\s+/g, ' ');

  if (normalized.length === 0) {
    throw new MediaAltTextRequiredError();
  }

  return normalized;
}

function validDimension(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value > 0);
}

export class MediaMetadata {
  private constructor(private readonly props: MediaMetadataProps) {}

  static create(props: MediaMetadataProps): MediaMetadata {
    const storagePath = props.storagePath.trim();
    const mimeType = props.mimeType.trim().toLowerCase();
    const pathMatch = STORAGE_PATH_PATTERN.exec(storagePath);
    const extensions = MEDIA_EXTENSIONS_BY_MIME_TYPE[mimeType as SupportedMediaMimeType] as
      readonly string[] | undefined;
    const pathExtension = pathMatch?.groups?.extension?.toLowerCase();
    const dimensionsArePaired = (props.width === null) === (props.height === null);

    if (
      !pathMatch ||
      !pathExtension ||
      !extensions?.includes(pathExtension) ||
      !Number.isSafeInteger(props.sizeBytes) ||
      props.sizeBytes <= 0 ||
      props.sizeBytes > MAX_MEDIA_SIZE_BYTES ||
      !validDimension(props.width) ||
      !validDimension(props.height) ||
      !dimensionsArePaired
    ) {
      throw new MediaMetadataInvalidError();
    }

    return new MediaMetadata({
      altText: normalizeAltText(props.altText),
      height: props.height,
      mimeType,
      sizeBytes: props.sizeBytes,
      storagePath,
      width: props.width,
    });
  }

  get altText(): string {
    return this.props.altText;
  }

  get hasDimensions(): boolean {
    return this.props.width !== null && this.props.height !== null;
  }

  get height(): number | null {
    return this.props.height;
  }

  get mimeType(): SupportedMediaMimeType {
    return this.props.mimeType as SupportedMediaMimeType;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get storagePath(): string {
    return this.props.storagePath;
  }

  get width(): number | null {
    return this.props.width;
  }
}
