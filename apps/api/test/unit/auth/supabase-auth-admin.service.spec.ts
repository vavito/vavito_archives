import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseAuthAdminService } from '@api/core/auth/services/supabase-auth-admin.service';

const USER_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';

describe('SupabaseAuthAdminService', () => {
  const deleteUser = jest.fn();
  const supabase = { auth: { admin: { deleteUser } } } as unknown as SupabaseClient;
  const service = new SupabaseAuthAdminService(supabase);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exclui definitivamente a identidade pela API administrativa', async () => {
    deleteUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await service.deleteUser(USER_ID);

    expect(deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it('trata identidade já ausente como exclusão concluída', async () => {
    deleteUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 404 } });

    await expect(service.deleteUser(USER_ID)).resolves.toBeUndefined();
  });

  it('propaga falhas administrativas diferentes de 404', async () => {
    const error = { message: 'service unavailable', status: 503 };
    deleteUser.mockResolvedValueOnce({ data: { user: null }, error });

    await expect(service.deleteUser(USER_ID)).rejects.toBe(error);
  });
});
