import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "bitacora_session";
export const SESSION_DAYS = 120;

const DEV_PASSWORD = "bitacora";
const DEV_SECRET = "dev-only-secret-change-me";

export function authConfig() {
  const isProd = process.env.NODE_ENV === "production";
  const password = process.env.APP_PASSWORD || (isProd ? "" : DEV_PASSWORD);
  const secret = process.env.AUTH_SECRET || (isProd ? "" : DEV_SECRET);
  return { password, secret, configured: Boolean(password && secret) };
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const { secret } = authConfig();
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `v1.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const { secret, configured } = authConfig();
  if (!configured) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, secret));
  const given = Buffer.from(parts[2]);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function checkPassword(input: string): boolean {
  const { password, configured } = authConfig();
  if (!configured) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(password).digest();
  return timingSafeEqual(a, b);
}
