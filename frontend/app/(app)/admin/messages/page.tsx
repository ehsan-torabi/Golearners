import type { Metadata } from "next";
import { AdminMessages } from "@/components/admin/messages";

export const metadata: Metadata = { title: "پیام‌های تماس", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="reveal text-xl leading-7 text-foreground">پیام‌های تماس</h1>
      <AdminMessages />
    </div>
  );
}
