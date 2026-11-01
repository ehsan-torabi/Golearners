import type { Metadata } from "next";
import { CourseEditor } from "@/components/admin/course-editor";

export const metadata: Metadata = { title: "دورهٔ تازه | مدیریت" };
export const dynamic = "force-dynamic";

export default function NewCoursePage() {
  return (
    <div className="space-y-4">
      <h1 className="reveal text-xl leading-7 text-foreground">دورهٔ تازه</h1>
      <CourseEditor courseId={null} />
    </div>
  );
}
