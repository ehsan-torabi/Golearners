// Typed API client for the Go backend.
// Browser: same-origin /api via next rewrites (cookies stay on one domain).
// Server (RSC/ISR/sitemap): absolute backend URL; relative URLs hang the build.
function apiBase(): string {
  return typeof window === "undefined"
    ? (process.env.API_INTERNAL ?? "http://localhost:8080") + "/api/v1"
    : "/api/v1";
}

export const API = "/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Read the CSRF token from the readable cookie. */
export function csrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)gl_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let code = "INTERNAL_ERROR";
    let message = "خطای غیرمنتظره رخ داد؛ لطفاً دوباره تلاش کنید.";
    try {
      const body = (await res.json()) as { error?: { code: string; message: string } };
      if (body.error) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRF-Token", csrfToken());
  }
  const timeout = AbortSignal.timeout(typeof window === "undefined" ? 4000 : 15000);
  const res = await fetch(apiBase() + path, {
    ...init,
    method,
    headers,
    credentials: "same-origin",
    signal: init.signal ?? timeout,
  });
  return handle<T>(res);
}

// ---------- shared API shapes (snake_case from the backend) ----------

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: "beginner" | "intermediate" | "advanced";
  status: string;
  price_rial: number;
  compare_at_price_rial: number | null;
  is_featured: boolean;
  rating_avg: number | null;
  rating_count: number;
}

export interface Order {
  id: string;
  status: string;
  subtotal_rial: number;
  discount_rial: number;
  total_rial: number;
  expires_at: string;
  created_at?: string;
  paid_at?: string | null;
  items?: { course_id: string; title_snapshot: string; unit_price_rial: number }[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  gateway: string;
  status: string;
  amount_rial: number;
  card_masked: string | null;
}

/** Amount in toman (Rial/10), lives here to keep one formatting story. */
export function formatTomanFromRial(rial: number): string {
  const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  const grouped = Math.round(rial / 10).toLocaleString("en-US").replace(/,/g, "٬");
  const persian = grouped.replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
  return persian + " تومان";
}

export const LEVEL_FA: Record<CourseSummary["level"], string> = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export const LEVEL_COLORS: Record<CourseSummary["level"], "success" | "warning" | "destructive"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
};
