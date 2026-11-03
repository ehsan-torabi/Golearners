import type { Metadata } from "next";
import { CourseStats } from "@/components/admin/course-stats";

export const metadata: Metadata = { title: "آمار دوره | مدیریت", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminCourseStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseStats courseId={id} />;
}
