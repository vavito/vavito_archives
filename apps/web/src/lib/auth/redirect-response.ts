import { NextResponse, type NextRequest } from 'next/server';

export function createPrivateAuthRedirect(request: NextRequest, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url));

  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Expires', '0');
  response.headers.set('Pragma', 'no-cache');

  return response;
}
