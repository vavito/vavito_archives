import { SetMetadata } from '@nestjs/common';

import { OPTIONAL_AUTH_ROUTE_METADATA_KEY } from '@api/core/auth/constants/auth.constants';

/** Valida o JWT quando enviado, mas mantém a rota acessível sem autenticação. */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_ROUTE_METADATA_KEY, true);
