import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/post-editor";

export const metadata: Metadata = { title: "نوشتهٔ تازه | مدیریت" };
export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <h1 className="reveal text-xl leading-7 text-foreground">نوشتهٔ تازه</h1>
      <PostEditor postId={null} />
    </div>
  );
}
