import type { Metadata } from "next";
import { CourseEditor } from "@/components/admin/course-editor";

export const metadata: Metadata = { title: "ویرایش دوره | مدیریت" };
export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="reveal text-xl leading-7 text-foreground">ویرایش دوره</h1>
      <CourseEditor courseId={id} />
    </div>
  );
}
