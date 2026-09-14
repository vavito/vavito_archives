import sharp from 'sharp';

export interface ImageOptimizationOptions {
  maxHeight: number;
  maxWidth: number;
  quality?: number;
}

export interface OptimizedImage {
  buffer: Buffer;
  height: number;
  width: number;
}

const DEFAULT_WEBP_QUALITY = 82;

export async function optimizeImageToWebp(
  buffer: Buffer,
  options: ImageOptimizationOptions,
): Promise<OptimizedImage> {
  const { data, info } = await sharp(buffer, { failOn: 'warning' })
    .rotate()
    .resize({
      fit: 'inside',
      height: options.maxHeight,
      width: options.maxWidth,
      withoutEnlargement: true,
    })
    .webp({
      effort: 4,
      quality: options.quality ?? DEFAULT_WEBP_QUALITY,
      smartSubsample: true,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    height: info.height,
    width: info.width,
  };
}
