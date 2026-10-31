import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "درباره مدرس",
  description: "معرفی مدرس دوره‌های برنامه‌نویسی گوLearn.",
  alternates: { canonical: "/instructor" },
};

export default function InstructorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "مدرس گوLearn",
    jobTitle: "مهندس نرم‌افزار و مدرس",
    worksFor: { "@type": "Organization", name: "گوLearn" },
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-display text-2xl">درباره مدرس</h1>
      <Card className="p-8 text-sm leading-8">
        <p>
          سلام! من احسان هستم؛ مهندس نرم‌افزار و مدرس برنامه‌نویسی. سال‌هاست در پروژه‌های واقعی
          کار می‌کنم و همان چیزهایی را اینجا آموزش می‌دهم که در کار روزمره به کار می‌آیند —
          بدون پرت‌کردن وقت با مباحث تزئینی.
        </p>
        <p className="mt-4">
          فلسفه‌ی آموزش من ساده است: اول ساختن، بعد فهمیدن عمیق. هر دوره یک پروژه‌ی واقعی است
          که از صفر تا استقرار با هم جلو می‌رویم.
        </p>
        <p className="mt-4 text-muted-foreground">
          (این متن نمونه است — استاد می‌تواند از پنل مدیریت، «صفحات» را ویرایش کند.)
        </p>
      </Card>
    </div>
  );
}
