import type { UploadProgress } from '@web/lib/api/upload-form-data';

export interface UploadedArticleImage {
  altText: string;
  height: number | null;
  id: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  url: string;
  width: number | null;
}

export interface UploadArticleImageOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export type UploadArticleImage = (
  file: File,
  altText: string,
  options?: UploadArticleImageOptions,
) => Promise<UploadedArticleImage>;
