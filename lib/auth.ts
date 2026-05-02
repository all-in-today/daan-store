import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "allin-admin-secret-key-change-in-production"
);

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin1234";

export async function signAdminToken() {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export function checkCredentials(username: string, password: string) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}
