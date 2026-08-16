import { SetMetadata } from '@nestjs/common';

import { PUBLIC_ROUTE_METADATA_KEY } from '@api/core/auth/constants/auth.constants';

/** Libera uma rota da autenticação JWT aplicada globalmente. */
export const Public = () => SetMetadata(PUBLIC_ROUTE_METADATA_KEY, true);
