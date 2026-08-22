export type StorageOperation = 'remove' | 'upload';

export class StorageOperationError extends Error {
  constructor(
    readonly operation: StorageOperation,
    options?: ErrorOptions,
  ) {
    super(`Storage ${operation} operation failed.`, options);
    this.name = StorageOperationError.name;
  }
}
