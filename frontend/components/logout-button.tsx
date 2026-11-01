"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { api } from "@/lib/api";

/* POST /auth/logout clears the session cookies; the user signs in again. */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await api("/auth/logout", { method: "POST" });
        } finally {
          router.push("/login");
          router.refresh();
        }
      }}
      className={className}
    >
      <LogOutIcon className="size-4" aria-hidden />
      خروج از حساب
    </button>
  );
}
