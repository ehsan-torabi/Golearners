"use client";

import * as React from "react";

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

let cached: Promise<Session> | null = null;

/* the access cookie is HttpOnly, so the browser learns the session from /me.
   One request per page load, shared by every consumer. */
function loadSession(): Promise<Session> {
  if (!cached) {
    cached = fetch("/api/v1/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return null;
        const me = (await res.json()) as {
          id: string;
          full_name: string;
          mobile: string;
          roles: string[];
        };
        return { id: me.id, full_name: me.full_name, mobile: me.mobile, roles: me.roles ?? [] };
      })
      .catch(() => null);
  }
  return cached;
}

export function useSession(): SessionState {
  const [session, setSession] = React.useState<Session>(null);
  const [status, setStatus] = React.useState<"loading" | "ready">("loading");

  React.useEffect(() => {
    let alive = true;
    void loadSession().then((s) => {
      if (!alive) return;
      setSession(s);
      setStatus("ready");
    });
    return () => {
      alive = false;
    };
  }, []);

  return {
    status,
    session,
    isAdmin: Boolean(session?.roles?.includes("admin")),
  };
}
