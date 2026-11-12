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
  series_id: string | null;
  series_part: number | null;
  featured: boolean;
  og_image_media_id: string | null;
  views: number;
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
  series_id: string | null;
  series_part: number | null;
  featured: boolean;
  og_image_media_id: string | null;
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

// ---------- blog series ----------

export interface AdminSeries {
  id: string;
  slug: string;
  title: string;
  description: string;
  created_at: string;
  posts_count: number;
}

export function adminListSeries() {
  return fetchAdmin<{ data: AdminSeries[] }>("/admin/series");
}

export interface SeriesPayload {
  title: string;
  slug: string;
  description: string;
}

export async function adminCreateSeries(input: SeriesPayload) {
  return api("/admin/series", { method: "POST", body: JSON.stringify(input) });
}

export async function adminUpdateSeries(id: string, input: SeriesPayload) {
  return api(`/admin/series/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function adminDeleteSeries(id: string) {
  return api(`/admin/series/${id}`, { method: "DELETE" });
}

// ---------- blog comments ----------

export interface AdminComment {
  id: string;
  post_id: string;
  post_slug: string;
  post_title: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  body: string;
  status: string;
  created_at: string;
}

export function adminListComments(params: { status?: string; q?: string; page?: number; per_page?: number }) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const qs = search.toString();
  return fetchAdmin<{
    data: AdminComment[];
    counts: Record<string, number>;
    meta: { page: number; per_page: number; total: number };
  }>(`/admin/comments${qs ? `?${qs}` : ""}`);
}

export async function adminCommentAction(id: string, action: "approve" | "unapprove" | "spam") {
  return api(`/admin/comments/${id}/${action}`, { method: "POST" });
}

export async function adminDeleteComment(id: string) {
  return api(`/admin/comments/${id}`, { method: "DELETE" });
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

// ---------- course statistics ----------

/** One course row of the admin statistics table. */
export interface CourseStatsRow {
  course_id: string;
  slug: string;
  title: string;
  summary: string;
  level: string;
  status: string;
  price_rial: number;
  cover_media_id: string | null;
  cover_url: string;
  published_at: string | null;
  enrollments: number;
  paid_enrollments: number;
  granted_enrollments: number;
  orders: number;
  buyers: number;
  revenue_rial: number;
  refund_rial: number;
  net_revenue_rial: number;
  avg_rating: number;
  review_count: number;
  pending_reviews: number;
  lessons: number;
  sections: number;
  duration_seconds: number;
  started_learners: number;
  active_learners: number;
  completed_lessons: number;
  completion_pct: number;
  watch_seconds: number;
  watch_learners: number;
  last_activity_at: string | null;
}

/** One lesson's engagement inside a course. */
export interface CourseLessonStat {
  lesson_id: string;
  title: string;
  section_title: string;
  section_position: number;
  position: number;
  status: string;
  duration_seconds: number;
  started: number;
  completed: number;
  completion_pct: number;
  watch_seconds: number;
  avg_position_pct: number;
}

/** One learner review on a course. */
export interface CourseStatsReview {
  id: string;
  user_name: string;
  rating: number;
  body: string;
  status: string;
  created_at: string;
}

/** The full statistics payload of one course. */
export interface CourseStatsDetail {
  course: {
    course_id: string;
    slug: string;
    title: string;
    summary: string;
    level: string;
    status: string;
    price_rial: number;
    cover_media_id: string | null;
    cover_url: string;
    published_at: string | null;
  };
  metrics: Omit<CourseStatsRow, "course_id" | "slug" | "title" | "summary" | "level" | "status" | "price_rial" | "cover_media_id" | "cover_url" | "published_at">;
  series: {
    days: string[];
    enrollments: number[];
    revenue_rial: number[];
    watch_seconds: number[];
    active_learners: number[];
  };
  lessons: CourseLessonStat[];
  sources: Record<string, number>;
  reviews: CourseStatsReview[];
}

export function adminCourseStatsDetail(id: string, days = 60) {
  return fetchAdmin<{ data: CourseStatsDetail }>(`/admin/course-stats/${id}?days=${days}`);
}

/** One learner's standing in one course. */
export interface CourseLearnerStat {
  user_id: string;
  full_name: string;
  mobile: string;
  source: string;
  granted_at: string;
  spent_rial: number;
  lessons_total: number;
  lessons_started: number;
  lessons_done: number;
  progress_pct: number;
  watch_seconds: number;
  last_activity_at: string | null;
  rating: number | null;
}


// ---------- AI assistant (دستیار هوشمند) ----------

/**
 * The admin AI endpoints run long (one provider call can take minutes), so
 * they bypass api()'s 15s timeout with their own request helper. Errors keep
 * the backend's Persian message.
 */
async function aiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRF-Token", csrfToken());
  }
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    method,
    headers,
    credentials: "same-origin",
    signal: init.signal ?? AbortSignal.timeout(180000),
  });
  if (!res.ok) {
    let message = "درخواست مدیریتی ناموفق بود.";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* keep the fallback message */
    }
    throw new ApiError(res.status, "ADMIN_ERROR", message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function aiData<T>(path: string, init: RequestInit = {}): Promise<T> {
  const body = await aiRequest<{ data: T }>(path, init);
  return body.data;
}

/** Provider configuration as the panel sees it — the key never round-trips. */
export interface AISettings {
  enabled: boolean;
  provider: string;
  base_url: string;
  api_key_set: boolean;
  api_key_last4: string;
  model: string;
  temperature: number;
  max_tokens: number;
  persona: string;
}

/** PUT payload; api_key empty keeps the stored one, clear_api_key erases it. */
export interface AISettingsPayload {
  enabled: boolean;
  provider: string;
  base_url: string;
  api_key?: string;
  clear_api_key?: boolean;
  model: string;
  temperature: number;
  max_tokens: number;
  persona: string;
}

export function adminAISettings() {
  return aiData<AISettings>("/admin/ai/settings");
}

export function adminSaveAISettings(payload: AISettingsPayload) {
  return aiData<AISettings>("/admin/ai/settings", { method: "PUT", body: JSON.stringify(payload) });
}

export function adminAITestConnection() {
  return aiData<{ ok: boolean; latency_ms: number; model: string; provider: string; error?: string }>(
    "/admin/ai/settings/test",
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function adminAIModels() {
  return aiData<string[]>("/admin/ai/models");
}

export type AIKind = "blog_post" | "course_copy" | "seo" | "stats_report" | "freeform";
export type AIStatus = "pending" | "applied" | "rejected" | "ready" | "failed";

/** One AI proposal (or read-only report) with before/after snapshots. */
export interface AIDraft {
  id: number;
  kind: AIKind;
  action: "create" | "update" | "none";
  target_type: "" | "post" | "course";
  target_id?: string;
  target_label: string;
  status: AIStatus;
  summary: string;
  notes: string;
  instructions: string;
  original?: Record<string, unknown> | null;
  proposed: Record<string, unknown>;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  error: string;
  created_at: string;
  decided_at?: string;
  applied_at?: string;
}

export function adminAIGenerate(req: {
  kind: AIKind;
  target_type?: string;
  target_id?: string;
  instructions?: string;
}) {
  return aiData<AIDraft>("/admin/ai/generate", { method: "POST", body: JSON.stringify(req) });
}

export function adminAIDrafts(status = "", kind = "", page = 1, perPage = 20) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (kind) params.set("kind", kind);
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  return aiRequest<AdminList<AIDraft>>(`/admin/ai/drafts?${params.toString()}`);
}

export function adminAIDraft(id: number) {
  return aiData<AIDraft>(`/admin/ai/drafts/${id}`);
}

export function adminAIApprove(id: number) {
  return aiData<AIDraft>(`/admin/ai/drafts/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
}

export function adminAIReject(id: number) {
  return aiData<AIDraft>(`/admin/ai/drafts/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
}

export function adminAIDeleteDraft(id: number) {
  return aiRequest<void>(`/admin/ai/drafts/${id}`, { method: "DELETE" });
}

export function adminAIUsage(days = 30) {
  return aiData<{
    summary: { requests: number; ok: number; failed: number; prompt_tokens: number; completion_tokens: number; by_kind: Record<string, number> };
    daily: { day: string; requests: number; prompt_tokens: number; completion_tokens: number }[];
  }>(`/admin/ai/usage?days=${days}`);
}
