"use client";

// Client-side admin mutations: CSRF + cookie session via the /api proxy.
import { ApiError, api, csrfToken } from "@/lib/api";

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

export async function adminCreateCourse(input: {
  title: string;
  slug: string;
  summary: string;
  description_html: string;
  level: string;
  price_rial: number;
}) {
  return api("/admin/courses", { method: "POST", body: JSON.stringify(input) });
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

export async function adminPublishPost(id: string, publish: boolean) {
  return api(`/admin/posts/${id}/${publish ? "publish" : "unpublish"}`, { method: "POST" });
}

export async function adminDeletePost(id: string) {
  return api(`/admin/posts/${id}`, { method: "DELETE" });
}
