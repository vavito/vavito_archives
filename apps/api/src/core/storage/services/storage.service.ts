export interface StorageUpload {
  bucket: string;
  buffer: Buffer;
  contentType: string;
  path: string;
}

export abstract class StorageService {
  abstract publicUrl(bucket: string, path: string): string;
  abstract remove(bucket: string, path: string): Promise<void>;
  abstract upload(file: StorageUpload): Promise<void>;
}
