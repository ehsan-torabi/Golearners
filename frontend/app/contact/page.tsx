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
      <h1 className="font-display text-2xl">تماس با ما</h1>
      <p className="text-sm text-muted-foreground">
        سوال فنی درباره‌ی درس‌ها، مشکل پرداخت یا هر چیز دیگر — پیام بگذارید، سریع جواب می‌دهیم.
      </p>
      <Card className="p-8">
        <ContactForm />
      </Card>
    </div>
  );
}
