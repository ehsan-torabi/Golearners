"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoursesList } from "@/components/admin/courses-list";
import { CourseStatsList } from "@/components/admin/course-stats-list";

/**
 * The course section of the admin console: the course list and the
 * statistics table are two views of the same courses, so they share the
 * route and switch with a tab bar.
 */
export default function AdminCoursesPage() {
  const [tab, setTab] = React.useState("courses");

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <TabsList variant="line">
        <TabsTrigger value="courses">فهرست</TabsTrigger>
        <TabsTrigger value="stats">آمار</TabsTrigger>
      </TabsList>
      <TabsContent value="courses">
        <CoursesList />
      </TabsContent>
      <TabsContent value="stats">
        <CourseStatsList />
      </TabsContent>
    </Tabs>
  );
}
