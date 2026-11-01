import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/post-editor";

export const metadata: Metadata = { title: "ویرایش نوشته | مدیریت" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="reveal text-xl leading-7 text-foreground">ویرایش نوشته</h1>
      <PostEditor postId={id} />
    </div>
  );
}
