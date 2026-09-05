'use client';

import 'client-only';

import { ApiClientError, type components } from '@vavito/api-client';

import { uploadAuthenticatedFormData } from '@web/lib/api/upload-form-data';
import { WEB_API_UPLOAD_REQUEST_TIMEOUT_MS } from '@web/lib/api/page-data-timeout';
import { createBrowserSupabaseClient } from '@web/lib/auth/supabase/client';

import type { UploadArticleImage, UploadedArticleImage } from '../types/admin-media.types';

type ApiMediaResponse = components['schemas']['MediaResponseDto'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalDimension(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeMediaResponse(value: unknown): UploadedArticleImage {
  if (
    !isRecord(value) ||
    typeof value['id'] !== 'string' ||
    typeof value['url'] !== 'string' ||
    typeof value['altText'] !== 'string' ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(String(value['mimeType']))
  ) {
    throw new Error('Não foi possível confirmar a imagem enviada.');
  }

  return {
    altText: value['altText'],
    height: optionalDimension(value['height']),
    id: value['id'],
    mimeType: value['mimeType'] as UploadedArticleImage['mimeType'],
    url: value['url'],
    width: optionalDimension(value['width']),
  };
}

export const uploadArticleImage: UploadArticleImage = async (file, altText, options = {}) => {
  const supabase = createBrowserSupabaseClient();
  const formData = new FormData();
  formData.set('file', file);
  formData.set('altText', altText);

  const response = await uploadAuthenticatedFormData<ApiMediaResponse>(
    '/api/v1/admin/media',
    formData,
    {
      getAccessToken: async () => {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw ApiClientError.missingAccessToken();
        }

        return data.session?.access_token;
      },
      ...(options.onProgress ? { onProgress: options.onProgress } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      timeoutMs: WEB_API_UPLOAD_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeMediaResponse(response);
};
