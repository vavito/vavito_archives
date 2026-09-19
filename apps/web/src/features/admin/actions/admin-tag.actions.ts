'use server';

import { ApiClientError } from '@vavito/api-client';
import { revalidatePath, revalidateTag } from 'next/cache';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

import { requireAdminSession } from '../services/admin-session.service';
import { updateAdminTagVisibility } from '../services/admin-tags.service';
import type { AdminActionResult } from '../types/admin-community.types';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
}

export async function updateAdminTagVisibilityAction(
  id: string,
  isPublic: boolean,
): Promise<AdminActionResult<{ id: string; isPublic: boolean }>> {
  if (!isUuid(id) || typeof isPublic !== 'boolean') {
    return { ok: false, message: 'Tópico inválido.' };
  }

  const session = await requireAdminSession();
  try {
    const tag = await updateAdminTagVisibility(
      id,
      isPublic,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    revalidateTag('public-content', 'max');
    revalidatePath('/');
    revalidatePath('/artigos');
    revalidatePath('/admin/posts');
    return {
      ok: true,
      data: { id: tag.id, isPublic: tag.isPublic },
      message: 'Tópico atualizado.',
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiClientError ? error.message : 'Não foi possível atualizar o tópico.',
    };
  }
}
