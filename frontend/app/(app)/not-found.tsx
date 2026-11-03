import { ErrorPage } from "@/components/ui/error-page";

/** 404 inside the dashboard/admin area. */
export default function AppNotFound() {
  return (
    <ErrorPage
      code="۴۰۴"
      title="این بخش پیدا نشد"
      body="نشانی‌ای که دنبالش بودید در پنل کاربری وجود ندارد. از داشبورد ادامه دهید."
      className="mx-auto w-full max-w-2xl px-4"
    />
  );
}
