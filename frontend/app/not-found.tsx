import { ErrorPage } from "@/components/ui/error-page";

/** Global 404 for unmatched URLs (rendered inside the root layout). */
export default function NotFound() {
  return (
    <ErrorPage
      code="۴۰۴"
      title="این صفحه پیدا نشد"
      body="نشانی‌ای که دنبالش بودید وجود ندارد یا جابه‌جا شده است. از مسیرهای زیر ادامه دهید."
      className="mx-auto w-full max-w-2xl px-4"
    />
  );
}
