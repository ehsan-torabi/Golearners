import { cookies } from "next/headers";

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
