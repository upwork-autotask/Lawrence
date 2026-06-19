import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-insecure-secret-change-me');
const ALG = 'HS256';

export type TokenClaims = { sub: string; sid: string };

export async function signToken(claims: TokenClaims, expiresInSeconds: number): Promise<string> {
  return new SignJWT({ sid: claims.sid })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    if (typeof payload.sub === 'string' && typeof payload.sid === 'string') {
      return { sub: payload.sub, sid: payload.sid };
    }
    return null;
  } catch {
    return null;
  }
}
