import {
  createSocialPreviewImage,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_SIZE,
} from '@web/lib/seo/social-image';

export const alt = SOCIAL_IMAGE_ALT;
export const contentType = 'image/png';
export const size = SOCIAL_IMAGE_SIZE;

export default function OpenGraphImage() {
  return createSocialPreviewImage();
}
