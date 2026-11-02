"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export type Session = {
  id: string;
  full_name: string;
  mobile: string;
  roles: string[];
} | null;

export type SessionState = {
  status: "loading" | "ready";
  session: Session;
  isAdmin: boolean;
};

/* The access cookie is HttpOnly, so the browser learns the session from /me.
   Refetched on every navigation: signing in or out must change the header
   immediately, so no long-lived cache. */
export function useSession(): SessionState {
  const pathname = usePathname();
  const [session, setSession] = React.useState<Session>(null);
  const [status, setStatus] = React.useState<"loading" | "ready">("loading");

  React.useEffect(() => {
    let alive = true;
    setStatus("loading");
    fetch("/api/v1/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (!alive || !res.ok) return null;
        const me = (await res.json()) as {
          id: string;
          full_name: string;
          mobile: string;
          roles: string[];
        };
        return {
          id: me.id,
          full_name: me.full_name,
          mobile: me.mobile,
          roles: me.roles ?? [],
        };
      })
      .catch(() => null)
      .then((s) => {
        if (!alive) return;
        setSession(s);
        setStatus("ready");
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  return {
    status,
    session,
    // the owner passes every admin gate, so the header must treat it as admin
    isAdmin: Boolean(session?.roles?.some((r) => r === "admin" || r === "owner")),
  };
}
