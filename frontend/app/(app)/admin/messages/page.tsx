import type { Metadata } from "next";
import { AdminMessages } from "@/components/admin/messages";

export const metadata: Metadata = { title: "پیام‌های تماس", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminMessagesPage() {
  return <AdminMessages />;
}
