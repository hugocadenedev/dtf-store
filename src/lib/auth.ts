import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dtf-store-dev-secret-key-not-for-production"
);

const COOKIE_NAME = "dtf-session";

/** Comma-separated list of admin emails (set in .env) */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface SessionPayload {
  customerId: string;
  email: string;
  name: string;
}

/* ─── JWT helpers ─────────────────────────────────────────── */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/* ─── Cookie helpers ──────────────────────────────────────── */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/* ─── Get current customer ────────────────────────────────── */
export async function getCurrentCustomer() {
  const token = await getSessionCookie();
  if (!token) return null;

  const session = await verifyToken(token);
  if (!session) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return customer;
}

/* ─── Admin check (API routes) ────────────────────────────── */
/**
 * Checks whether the request comes from an authenticated admin.
 * Admin emails are configured via the ADMIN_EMAILS env variable.
 * Works with API route handlers (reads cookie from request headers).
 */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const session = await verifyToken(token);
  if (!session) return false;

  if (ADMIN_EMAILS.length === 0) {
    // Fallback: if no ADMIN_EMAILS configured, deny all
    console.warn("ADMIN_EMAILS not configured — admin access denied");
    return false;
  }

  return ADMIN_EMAILS.includes(session.email.toLowerCase());
}
