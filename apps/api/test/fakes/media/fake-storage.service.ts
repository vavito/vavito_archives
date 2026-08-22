import { StorageOperationError } from '@api/core/storage/errors/storage-operation.error';
import { StorageService, type StorageUpload } from '@api/core/storage/services/storage.service';

export interface StorageRemovalAttempt {
  bucket: string;
  path: string;
}

function objectKey(bucket: string, path: string): string {
  return `${bucket}/${path}`;
}

export class FakeStorageService extends StorageService {
  readonly removeAttempts: StorageRemovalAttempt[] = [];
  readonly uploadAttempts: StorageUpload[] = [];
  private readonly objects = new Map<string, StorageUpload>();
  private nextRemoveError: Error | null = null;
  private nextUploadError: Error | null = null;

  failNextRemove(error: Error = new StorageOperationError('remove')): void {
    this.nextRemoveError = error;
  }

  failNextUpload(error: Error = new StorageOperationError('upload')): void {
    this.nextUploadError = error;
  }

  hasObject(bucket: string, path: string): boolean {
    return this.objects.has(objectKey(bucket, path));
  }

  publicUrl(bucket: string, path: string): string {
    return `https://storage.test/${bucket}/${path}`;
  }

  remove(bucket: string, path: string): Promise<void> {
    this.removeAttempts.push({ bucket, path });

    if (this.nextRemoveError) {
      const error = this.nextRemoveError;
      this.nextRemoveError = null;
      return Promise.reject(error);
    }

    this.objects.delete(objectKey(bucket, path));
    return Promise.resolve();
  }

  reset(): void {
    this.nextRemoveError = null;
    this.nextUploadError = null;
    this.objects.clear();
    this.removeAttempts.length = 0;
    this.uploadAttempts.length = 0;
  }

  upload(file: StorageUpload): Promise<void> {
    const uploadedFile = { ...file, buffer: Buffer.from(file.buffer) };
    this.uploadAttempts.push(uploadedFile);

    if (this.nextUploadError) {
      const error = this.nextUploadError;
      this.nextUploadError = null;
      return Promise.reject(error);
    }

    this.objects.set(objectKey(file.bucket, file.path), uploadedFile);
    return Promise.resolve();
  }
}
