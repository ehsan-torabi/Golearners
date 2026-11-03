import { ErrorPage } from "@/components/ui/error-page";

/** 404 inside the public site shell (navbar + footer stay). */
export default function SiteNotFound() {
  return (
    <ErrorPage
      code="۴۰۴"
      title="این صفحه پیدا نشد"
      body="نشانی‌ای که دنبالش بودید وجود ندارد یا جابه‌جا شده است. دوره‌ها و نوشته‌های گوLearn اینجا منتظر شماست."
    />
  );
}
