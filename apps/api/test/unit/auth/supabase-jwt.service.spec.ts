import { createServer, type Server } from 'node:http';

import { ConfigService } from '@nestjs/config';
import { exportJWK, generateKeyPair, SignJWT, type JWK, type KeyLike } from 'jose';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { SUPABASE_JWT_AUDIENCE } from '@api/core/auth/auth.constants';
import type { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import { createSupabaseJwks, supabaseIssuer } from '@api/core/auth/supabase-jwks';
import { SupabaseJwtService } from '@api/core/auth/supabase-jwt.service';

const USER_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';
const USER_EMAIL = 'leitor@vavitoarchives.com.br';
const KEY_ID = 'test-signing-key';

interface TokenOptions {
  audience?: string;
  email?: string | null;
  expirationTime?: string;
  issuer?: string;
  role?: string;
  subject?: string;
}

describe('SupabaseJwtService', () => {
  let issuer: string;
  let privateKey: KeyLike;
  let publicJwk: JWK;
  let server: Server;
  let service: SupabaseJwtService;
  let jwksRequests: number;

  async function signToken(options: TokenOptions = {}): Promise<string> {
    const payload: Record<string, unknown> = {
      role: options.role ?? SUPABASE_JWT_AUDIENCE,
    };

    if (options.email !== null) {
      payload.email = options.email ?? USER_EMAIL;
    }

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
      .setIssuedAt()
      .setExpirationTime(options.expirationTime ?? '5m')
      .setIssuer(options.issuer ?? issuer)
      .setAudience(options.audience ?? SUPABASE_JWT_AUDIENCE)
      .setSubject(options.subject ?? USER_ID)
      .sign(privateKey);
  }

  beforeAll(async () => {
    const keyPair = await generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    publicJwk = {
      ...(await exportJWK(keyPair.publicKey)),
      alg: 'RS256',
      kid: KEY_ID,
      use: 'sig',
    };
    jwksRequests = 0;

    server = createServer((request, response) => {
      if (request.url === '/auth/v1/.well-known/jwks.json') {
        jwksRequests += 1;
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ keys: [publicJwk] }));
        return;
      }

      response.writeHead(404);
      response.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Não foi possível iniciar o servidor JWKS de teste.');
    }

    const supabaseUrl = `http://127.0.0.1:${address.port}`;
    const configService = new ConfigService<ApplicationConfig, true>({
      supabase: {
        serviceRoleKey: 'not-used-for-jwt-validation',
        url: supabaseUrl,
      },
    } as ApplicationConfig);

    issuer = supabaseIssuer(supabaseUrl);
    service = new SupabaseJwtService(configService, createSupabaseJwks(configService));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('valida o token, mapeia sub/email e reutiliza o JWKS em cache', async () => {
    const token = await signToken();

    await expect(service.verify(token)).resolves.toEqual({
      email: USER_EMAIL,
      id: USER_ID,
    });
    await expect(service.verify(token)).resolves.toEqual({
      email: USER_EMAIL,
      id: USER_ID,
    });
    expect(jwksRequests).toBe(1);
  });

  it.each([
    ['expirado', { expirationTime: '0s' }],
    ['com issuer incorreto', { issuer: 'https://outro-projeto.supabase.co/auth/v1' }],
    ['com audience incorreta', { audience: 'anon' }],
    ['sem email', { email: null }],
    ['sem papel autenticado', { role: 'anon' }],
    ['com sub inválido', { subject: 'identificador-invalido' }],
  ] satisfies [string, TokenOptions][])('rejeita um token %s', async (_label, options) => {
    const token = await signToken(options);

    await expect(service.verify(token)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
    } satisfies Partial<UnauthenticatedException>);
  });
});
