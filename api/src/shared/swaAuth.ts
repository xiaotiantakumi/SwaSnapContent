import type { HttpRequest } from '@azure/functions';

export type ClientPrincipal = {
  userId: string;
  userRoles: string[];
  identityProvider: string;
  userDetails: string;
};

export function parseClientPrincipal(
  request: HttpRequest
): ClientPrincipal | null {
  const header = request.headers.get('x-ms-client-principal');
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

export function requireAuthenticated(
  request: HttpRequest
): ClientPrincipal | null {
  const principal = parseClientPrincipal(request);
  if (!principal) return null;
  if (!principal.userRoles?.includes('authenticated')) return null;
  return principal;
}
