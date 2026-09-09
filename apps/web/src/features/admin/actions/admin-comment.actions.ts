'use server';

import { ApiClientError } from '@vavito/api-client';
import { revalidatePath } from 'next/cache';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { isAdminResourceId } from '../schemas/admin-community.schema';
import { moderateAdminComment } from '../services/admin-comments.service';
import { requireAdminSession } from '../services/admin-session.service';
import type {
  AdminActionResult,
  AdminComment,
  ModerationStatus,
} from '../types/admin-community.types';

export async function moderateCommentAction(
  id: string,
  status: ModerationStatus,
  reason: string,
): Promise<AdminActionResult<AdminComment>> {
  const session = await requireAdminSession();
  if (
    !isAdminResourceId(id) ||
    !['VISIBLE', 'HIDDEN', 'SPAM'].includes(status) ||
    typeof reason !== 'string' ||
    reason.length > 500
  ) {
    return { ok: false, message: 'Revise os dados da moderação e tente novamente.' };
  }
  try {
    const data = await moderateAdminComment(
      id,
      status,
      reason,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    revalidatePath('/admin/comments');
    revalidatePath('/artigos/[slug]', 'page');
    return { ok: true, data, message: 'Moderação atualizada.' };
  } catch (error) {
    revalidatePath('/admin/comments');
    return {
      ok: false,
      message:
        error instanceof ApiClientError && (error.statusCode === 409 || error.statusCode === 404)
          ? 'Este comentário mudou ou foi excluído. Atualize a lista para continuar.'
          : 'Não foi possível moderar o comentário agora. Tente novamente.',
    };
  }
}
