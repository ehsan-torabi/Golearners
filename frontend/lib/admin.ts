"use client";

// Client-side admin mutations: CSRF + cookie session via the /api proxy.
import { ApiError, api, csrfToken, type CourseSummary } from "@/lib/api";

export { ApiError };

/** Admin GET with the CSRF header attached. */
export async function fetchAdmin<T>(path: string): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: { "X-CSRF-Token": csrfToken() },
    credentials: "same-origin",
  });
  if (!res.ok) throw new ApiError(res.status, "ADMIN_ERROR", "درخواست مدیریتی ناموفق بود.");
  return (await res.json()) as T;
}

/** List envelope the admin list endpoints share. */
export interface AdminList<T> {
  data: T[];
  meta: { page: number; per_page: number; total: number };
}

// ---------- courses ----------

/** A course with every admin-editable field. */
export interface AdminCourse extends CourseSummary {
  cover_media_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  description_html: string;
  prerequisites_html: string;
  outcomes: string[];
  promo_video_media_id: string | null;
  category_ids: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The admin course payload (PUT/POST body). */
export interface CoursePayload {
  title: string;
  slug: string;
  summary: string;
  description_html: string;
  level: string;
  price_rial: number;
  compare_at_price_rial: number | null;
  prerequisites_html: string;
  outcomes: string[];
  meta_title: string | null;
  meta_description: string | null;
  cover_media_id: string | null;
  promo_video_media_id: string | null;
  is_featured: boolean;
  category_ids: string[];
}

export function adminGetCourse(id: string) {
  return fetchAdmin<{ data: AdminCourse }>(`/admin/courses/${id}`);
}

export async function adminCreateCourse(input: CoursePayload) {
  return api("/admin/courses", { method: "POST", body: JSON.stringify(input) });
}

export async function adminUpdateCourse(id: string, input: CoursePayload) {
  return api(`/admin/courses/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function adminDeleteCourse(id: string) {
  return api(`/admin/courses/${id}`, { method: "DELETE" });
}

export async function adminPublishCourse(id: string, publish: boolean) {
  return api(`/admin/courses/${id}/${publish ? "publish" : "unpublish"}`, { method: "POST" });
}

export async function adminRefundOrder(id: string, reason: string) {
  return api(`/admin/orders/${id}/refund`, { method: "POST", body: JSON.stringify({ reason }) });
}

export async function adminSetUserStatus(id: string, status: "active" | "blocked") {
  return api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

// ---------- curriculum ----------

export interface AdminSection {
  id: string;
  course_id: string;
  title: string;
  position: number;
}

export interface AdminLesson {
  id: string;
  section_id: string;
  title: string;
  content_html: string;
  position: number;
  is_preview: boolean;
  duration_seconds: number;
  status: string;
  media_id: string | null;
}

/** Lesson payload (POST/PUT body). */
export interface LessonPayload {
  section_id?: string;
  title: string;
  content_html: string;
  position: number;
  is_preview: boolean;
  duration_seconds: number;
  status: string;
  media_id: string | null;
}

export function adminCurriculum(courseId: string) {
  return fetchAdmin<{ sections: AdminSection[]; lessons: AdminLesson[] }>(
    `/admin/courses/${courseId}/curriculum`,
  );
}

export async function adminCreateSection(courseId: string, input: { title: string; position: number }) {
  return api(`/admin/courses/${courseId}/sections`, { method: "POST", body: JSON.stringify(input) });
}

export async function adminUpdateSection(id: string, input: { title: string; position: number }) {
  return api(`/admin/sections/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function adminDeleteSection(id: string) {
  return api(`/admin/sections/${id}`, { method: "DELETE" });
}

export async function adminReorderSections(courseId: string, ids: string[]) {
  return api(`/admin/courses/${courseId}/sections/reorder`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function adminCreateLesson(sectionId: string, input: LessonPayload) {
  return api(`/admin/sections/${sectionId}/lessons`, { method: "POST", body: JSON.stringify(input) });
}

export async function adminUpdateLesson(id: string, input: LessonPayload) {
  return api(`/admin/lessons/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function adminDeleteLesson(id: string) {
  return api(`/admin/lessons/${id}`, { method: "DELETE" });
}

export async function adminReorderLessons(sectionId: string, ids: string[]) {
  return api(`/admin/sections/${sectionId}/lessons/reorder`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// ---------- posts ----------

/** A blog post with every admin-editable field. */
export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_html: string;
  status: string;
  cover_media_id: string | null;
  category_id: string | null;
  reading_minutes: number;
  meta_title: string | null;
  meta_description: string | null;
  tag_titles: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The admin post payload (PUT/POST body). */
export interface PostPayload {
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  cover_media_id: string | null;
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tag_titles: string[];
  reading_minutes: number;
}

export function adminGetPost(id: string) {
  return fetchAdmin<{ data: AdminPost }>(`/admin/posts/${id}`);
}

export async function adminCreatePost(input: PostPayload) {
  return api("/admin/posts", { method: "POST", body: JSON.stringify(input) });
}

export async function adminUpdatePost(id: string, input: PostPayload) {
  return api(`/admin/posts/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function adminDeletePost(id: string) {
  return api(`/admin/posts/${id}`, { method: "DELETE" });
}

export async function adminPublishPost(id: string, publish: boolean) {
  return api(`/admin/posts/${id}/${publish ? "publish" : "unpublish"}`, { method: "POST" });
}

// ---------- categories ----------

export interface CourseCategory {
  id: string;
  slug: string;
  title: string;
  icon: string;
  icon_media_id: string | null;
  icon_url?: string | null;
  position: number;
}

export function adminListCategories() {
  return fetchAdmin<{ data: CourseCategory[] }>("/admin/categories");
}

export async function adminCreateCategory(
  title: string,
  position = 0,
  icon = "",
  iconMediaId: string | null = null,
) {
  return api("/admin/categories", {
    method: "POST",
    body: JSON.stringify({ title, position, icon, icon_media_id: iconMediaId }),
  });
}

export async function adminUpdateCategory(
  id: string,
  title: string,
  position: number,
  icon = "",
  iconMediaId: string | null = null,
) {
  return api(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, position, icon, icon_media_id: iconMediaId }),
  });
}

export async function adminDeleteCategory(id: string) {
  return api(`/admin/categories/${id}`, { method: "DELETE" });
}

export async function adminCreateBlogCategory(title: string, position = 0) {
  return api("/admin/blog-categories", {
    method: "POST",
    body: JSON.stringify({ title, position }),
  });
}

export async function adminUpdateBlogCategory(id: string, title: string, position: number) {
  return api(`/admin/blog-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, position }),
  });
}

export async function adminDeleteBlogCategory(id: string) {
  return api(`/admin/blog-categories/${id}`, { method: "DELETE" });
}

// ---------- media ----------

export function adminListMedia(params: {
  page?: number;
  per_page?: number;
  kind?: string;
  status?: string;
  q?: string;
  sort?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  return fetchAdmin<AdminList<MediaAsset>>(`/admin/media?${search}`);
}

export async function adminDeleteMedia(id: string) {
  return api(`/admin/media/${id}`, { method: "DELETE" });
}

// ---------- reviews ----------

export interface AdminReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  body: string;
  status: string; // pending | approved | rejected
  approved_at: string | null;
  submitted_at: string | null;
  author_name: string;
  course_title: string;
}

export function adminListReviews(params: { page?: number; per_page?: number; status?: string }) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  return fetchAdmin<AdminList<AdminReview>>(`/admin/reviews?${search}`);
}

export async function adminModerateReview(id: string, approve: boolean) {
  return api(`/admin/reviews/${id}/moderate`, {
    method: "POST",
    body: JSON.stringify({ approve }),
  });
}


export interface TaxonomyItem {
  id: string;
  slug: string;
  title: string;
  position?: number;
}

export interface MediaAsset {
  id: string;
  kind: string;
  storage_key: string;
  filename: string;
  mime: string;
  size_bytes: number;
  status: string;
  duration_seconds: number | null;
  created_at: string;
  /** Public read path for image assets; other kinds have dedicated endpoints. */
  url: string | null;
}

export function fetchCourseCategories() {
  return api<{ data: TaxonomyItem[] }>("/categories");
}

export async function fetchBlogTaxonomy() {
  const [categories, tags] = await Promise.all([
    api<{ data: TaxonomyItem[] }>("/blog/categories"),
    api<{ data: TaxonomyItem[] }>("/blog/tags"),
  ]);
  return { categories: categories.data ?? [], tags: tags.data ?? [] };
}

/** Stored assets of one kind; failed uploads are hidden from pickers. */
export function fetchMedia(kind: "image" | "video") {
  return fetchAdmin<AdminList<MediaAsset>>("/admin/media?per_page=100").then((res) => ({
    ...res,
    data: res.data.filter((m) => m.kind === kind && m.status !== "failed"),
  }));
}


// ---------- instructor profile ----------

export interface InstructorProfile {
  headline: string;
  bio_html: string;
  avatar_media_id: string | null;
  socials: Record<string, string>;
}

export function fetchInstructorProfile() {
  return fetchAdmin<InstructorProfile>("/admin/instructor");
}

export function updateInstructorProfile(input: InstructorProfile) {
  return api("/admin/instructor", { method: "PUT", body: JSON.stringify(input) });
}

// ---------- admin orders ----------

export interface AdminOrderDetail {
  id: string;
  status: string;
  subtotal_rial: number;
  discount_rial: number;
  total_rial: number;
  expires_at: string;
  created_at?: string;
  paid_at?: string | null;
  items?: { course_id: string; title_snapshot: string; unit_price_rial: number }[];
  payments?: {
    id: string;
    gateway: string;
    status: string;
    amount_rial: number;
    card_masked: string | null;
    created_at?: string;
    verified_at?: string | null;
  }[];
  /** the API names the event list `events`; payload is base64-encoded JSON */
  events?: {
    id: string;
    payment_id: string;
    type: string;
    payload: string;
    created_at: string;
  }[];
}

export function adminGetOrder(id: string) {
  return fetchAdmin<AdminOrderDetail>(`/admin/orders/${id}`);
}
