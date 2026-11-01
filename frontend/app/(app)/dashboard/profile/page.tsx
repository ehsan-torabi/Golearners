import type { Metadata } from "next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { getMe } from "@/lib/me-server";
import { formatJalali } from "@/lib/jalali";
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
      <Card className="reveal overflow-hidden">
        <div className="h-14 bg-primary-tint" aria-hidden />
        <div className="flex flex-wrap items-end gap-4 px-6 pb-5">
          <div className="-mt-8 flex items-end gap-4">
            <Avatar className="size-16 border-4 border-card">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {initials(me.full_name) || "گ"}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="text-lg leading-7 text-foreground">{me.full_name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                عضو از {formatJalali(new Date(me.created_at))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pb-1 sm:ms-auto">
            {me.roles.map((r) => (
              <Badge key={r} tone="accent">
                {ROLE_FA[r] ?? r}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Card className="h-fit p-4">
          <nav aria-label="بخش‌های پروفایل" className="space-y-1">
            <span
              aria-current="true"
              className="block rounded-lg bg-primary-tint px-3 py-2 text-sm font-medium text-accent-strong"
            >
              حساب کاربری
            </span>
            <span className="block px-3 py-2 text-sm text-muted-foreground">
              مشخصات حساب فقط از پشتیبانی قابل تغییر است؛ از صفحهٔ تماس پیام بگذار.
            </span>
          </nav>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-medium text-foreground">اطلاعات حساب</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">نام و نام خانوادگی</dt>
                <dd className="mt-0.5 text-foreground">{me.full_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">شماره موبایل</dt>
                <dd className="mt-0.5 text-foreground" dir="ltr">
                  {me.mobile}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">ایمیل</dt>
                <dd className="mt-0.5 text-muted-foreground">ثبت نشده است</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">وضعیت حساب</dt>
                <dd className="mt-0.5">
                  <Badge tone={me.status === "active" ? "success" : "destructive"}>
                    {me.status === "active" ? "فعال" : "مسدود"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-medium text-foreground">تغییر رمز عبور</h2>
            <Separator className="my-4" />
            <PasswordChangeForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
