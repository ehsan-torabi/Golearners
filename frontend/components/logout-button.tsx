"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Logout control guarded by a confirmation dialog.
 * The sidebar passes its own styling; the header uses the compact icon form.
 */
export function LogoutButton({
  className,
  redirectTo = "/login",
  iconOnly = false,
}: {
  className?: string;
  redirectTo?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function logout() {
    setBusy(true);
    try {
      await api("/auth/logout", { method: "POST" });
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) setOpen(next);
      }}
    >
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className={className}
            aria-label={iconOnly ? "خروج از حساب" : undefined}
            title={iconOnly ? "خروج از حساب" : undefined}
          >
            <LogOutIcon className="size-4" aria-hidden />
            {!iconOnly && "خروج از حساب"}
          </button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>خروج از حساب</AlertDialogTitle>
          <AlertDialogDescription>
            پس از خروج، برای ادامه یادگیری یا مدیریت سایت باید دوباره وارد شوی.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction variant="destructive" loading={busy} onClick={() => void logout()}>
            خروج
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
