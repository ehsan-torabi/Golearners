import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./form";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "ارتباط با پشتیبانی گوLearn.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "تماس" }]} />
      <header className="reveal">
        <h1 className="font-semibold text-3xl">تماس با ما</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          سوال فنی درباره درس‌ها، مشکل پرداخت یا هر چیز دیگر؛ پیام بگذارید، سریع جواب می‌دهیم.
        </p>
      </header>
      <Card className="p-8">
        <ContactForm />
      </Card>
    </div>
  );
}
