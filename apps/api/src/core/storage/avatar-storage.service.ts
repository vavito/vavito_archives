export interface AvatarUpload {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export abstract class AvatarStorageService {
  abstract publicUrl(path: string): string;
  abstract remove(path: string): Promise<void>;
  abstract upload(profileId: string, file: AvatarUpload): Promise<string>;
}
