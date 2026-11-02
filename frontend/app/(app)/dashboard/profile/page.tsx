import type { Metadata } from "next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMe } from "@/lib/me-server";
import { formatJalali } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { PasswordChangeForm } from "./password-form";

export const metadata: Metadata = { title: "پروفایل", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROLE_FA: Record<string, string> = { learner: "دانشجو", admin: "مدیر", instructor: "مدرس" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
}

/* profile-05 structure: header band + avatar + identity, then sectioned panels.
   Only real data and real actions: no profile-edit API exists, so the edit
   panel is the (real) password change; the privacy panel does not exist. */
export default async function ProfilePage() {
  const me = await getMe();
  if (!me) {
    return (
      <EmptyState
        className="mt-10"
        title="برای دیدن پروفایل ابتدا وارد شو"
        actionHref="/login"
        actionLabel="ورود به حساب"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="reveal overflow-hidden p-0">
        <div className="hero-band flex flex-wrap items-center gap-4 px-6 py-6">
          <Avatar className="size-16 border-2 border-card shadow-raise">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {initials(me.full_name) || "گ"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-lg leading-7 text-foreground">{me.full_name}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              عضو از {formatJalali(new Date(me.created_at))}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:ms-auto">
            {me.roles.map((r) => (
              <span
                key={r}
                className="rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong"
              >
                {ROLE_FA[r] ?? r}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-0">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">اطلاعات حساب</h2>
          </div>
          <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">نام و نام خانوادگی</dt>
              <dd className="mt-1 font-medium text-foreground">{me.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">شماره موبایل</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium text-foreground" dir="ltr">
                {me.mobile}
                {me.status === "active" && (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-medium text-success-text" dir="rtl">
                    تأیید شده
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ایمیل</dt>
              <dd className="mt-1 text-muted-foreground">ثبت نشده است</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">وضعیت حساب</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    me.status === "active"
                      ? "bg-success-bg text-success-text"
                      : "bg-destructive-bg text-destructive-text",
                  )}
                >
                  {me.status === "active" ? "فعال" : "مسدود"}
                </span>
              </dd>
            </div>
          </dl>
          <p className="border-t border-line bg-muted/50 px-6 py-3 text-xs leading-6 text-muted-foreground">
            مشخصات حساب فقط از پشتیبانی قابل تغییر است؛ از صفحهٔ تماس پیام بگذار.
          </p>
        </Card>

        <Card className="p-0">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">تغییر رمز عبور</h2>
          </div>
          <div className="px-6 py-5">
            <PasswordChangeForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
