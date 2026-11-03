import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export interface MePayload {
  id: string;
  mobile: string;
  full_name: string;
  roles: string[];
  status: string;
  created_at: string;
}

/** Server-side /me fetch with the access cookie; null when unauthenticated. */
export async function getMe(): Promise<MePayload | null> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  if (!access) return null;
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me`, {
      headers: { Cookie: `gl_at=${access}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MePayload;
  } catch {
    return null;
  }
}

/** owner passes every admin gate — mirrors the backend RBAC. */
export function isAdmin(roles: string[] | undefined): boolean {
  return Boolean(roles?.some((r) => r === "admin" || r === "owner"));
}

/** The path the visitor asked for (middleware copies it into a request header). */
async function wantedPath(): Promise<string> {
  return (await headers()).get("x-pathname") ?? "";
}

/** Layout guard: a live session, otherwise the login page with a way back. */
export async function requireUser(): Promise<MePayload> {
  const me = await getMe();
  if (!me) redirect(`/login?next=${encodeURIComponent(await wantedPath())}`);
  return me;
}

/** Layout guard: admins only; anyone else is sent back to their dashboard. */
export async function requireAdmin(): Promise<MePayload> {
  const me = await requireUser();
  if (!isAdmin(me.roles)) redirect("/dashboard");
  return me;
}
