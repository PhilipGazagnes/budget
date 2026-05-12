import { SignJWT, jwtVerify } from 'jose';

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function encrypt(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key());
}

export async function decrypt(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, key(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}
