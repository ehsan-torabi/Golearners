import {
  expect,
  test as base,
  type APIRequestContext,
  type Cookie,
  type Page,
  type Playwright,
} from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";
export const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";
export const API_LOG = process.env.E2E_API_LOG ?? "/tmp/golearn-api.log";

/** Credentials the global setup makes sure exist; the file is written by it. */
interface Credentials {
  learner: { mobile: string; password: string };
  admin: { mobile: string; password: string };
}
const DEFAULT_CREDENTIALS: Credentials = {
  learner: { mobile: "09190000001", password: "Learner2026!" },
  admin: { mobile: "09121234567", password: "GoLearn2026!" },
};
const CREDENTIAL_FILE = path.join(__dirname, "..", "report", "state", "credentials.json");

/** Reads the credentials the global setup prepared (falls back to the defaults). */
export function credentials(): Credentials {
  if (!fs.existsSync(CREDENTIAL_FILE)) return DEFAULT_CREDENTIALS;
  try {
    return {
      ...DEFAULT_CREDENTIALS,
      ...(JSON.parse(fs.readFileSync(CREDENTIAL_FILE, "utf8")) as Credentials),
    };
  } catch {
    return DEFAULT_CREDENTIALS;
  }
}

/** A published course that exists in every environment (created by the seed/admin flow). */
export const COURSE_SLUG = process.env.E2E_COURSE_SLUG ?? "go-from-zero";
/** Coupon created by the global setup so the checkout spec can test discounts. */
export const COUPON_CODE = process.env.E2E_COUPON_CODE ?? "E2E10";

export type Role = "guest" | "learner" | "admin";

export interface Diagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  serverErrors: string[];
  clientErrors: string[];
  apiCalls: string[];
}

/**
 * Sessions live 15 minutes, so the suite logs in again when the cached
 * access token is about to expire instead of reusing a stale storage state.
 */
const sessionCache = new Map<Role, { cookies: Cookie[]; exp: number }>();

export async function sessionCookies(
  playwright: Playwright,
  role: Exclude<Role, "guest">,
): Promise<Cookie[]> {
  const cached = sessionCache.get(role);
  if (cached && cached.exp - 60 > Date.now() / 1000) return cached.cookies;

  const api = await playwright.request.newContext({ baseURL: API_URL });
  try {
    const creds = role === "admin" ? credentials().admin : credentials().learner;
    const res = await loginWithRetry(api, creds);
    if (!res.ok) {
      throw new Error(`login as ${role} failed: ${res.status} ${res.body}`);
    }
    const state = await api.storageState();
    const access = state.cookies.find((c) => c.name === "gl_at");
    sessionCache.set(role, { cookies: state.cookies, exp: access ? jwtExp(access.value) : 0 });
    return state.cookies;
  } finally {
    await api.dispose();
  }
}

/** Retries the login while the API is (re)starting. */
async function loginWithRetry(
  api: APIRequestContext,
  creds: { mobile: string; password: string },
): Promise<{ ok: boolean; status: number; body: string }> {
  let last = { ok: false, status: 0, body: "no attempt" };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await api.post("/api/v1/auth/login", {
        data: { mobile: creds.mobile, password: creds.password },
      });
      last = { ok: res.ok(), status: res.status(), body: res.ok() ? "" : await res.text() };
      if (res.ok()) return last;
    } catch (err) {
      last = { ok: false, status: 0, body: String(err) };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return last;
}

/** Reads the expiry out of a JWT without verifying it. */
function jwtExp(token: string): number {
  try {
    const payload = token.split(".")[1];
    return Number(JSON.parse(Buffer.from(payload, "base64url").toString()).exp) || 0;
  } catch {
    return 0;
  }
}

/** Collects console errors, page exceptions and failed/4xx/5xx requests per test. */
export const test = base.extend<{ sessionRole: Role; session: void; diag: Diagnostics }>({
  sessionRole: ["guest", { option: true }],
  session: [
    async ({ context, playwright, sessionRole }, use) => {
      if (sessionRole !== "guest") {
        await context.addCookies(await sessionCookies(playwright, sessionRole));
      }
      await use(undefined);
    },
    { auto: true },
  ],
  diag: async ({ page }, use, testInfo) => {
    const d: Diagnostics = {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      serverErrors: [],
      clientErrors: [],
      apiCalls: [],
    };
    page.on("console", (m) => {
      if (m.type() === "error") d.consoleErrors.push(m.text().slice(0, 400));
    });
    page.on("pageerror", (e) => d.pageErrors.push(`${e.name}: ${e.message}`.slice(0, 400)));
    page.on("requestfailed", (r) =>
      d.failedRequests.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText ?? "failed"}`),
    );
    page.on("response", (r) => {
      const line = `${r.status()} ${r.request().method()} ${r.url()}`;
      if (r.url().includes("/api/")) d.apiCalls.push(line);
      if (r.status() >= 500) d.serverErrors.push(line);
      else if (r.status() >= 400) d.clientErrors.push(line);
    });
    await use(d);
    // the reporter reads the diagnostics from the attachment, not from a map
    await testInfo.attach("diagnostics", {
      body: JSON.stringify(d),
      contentType: "application/json",
    });
  },
});

export { expect };

/** Fails the test when the page logged errors — catches silent client-side breakage. */
export function expectNoClientErrors(diag: Diagnostics): void {
  const noise = [...diag.pageErrors, ...diag.serverErrors];
  expect(noise, `client/server errors:\n${noise.join("\n")}`).toEqual([]);
}

/** Reads the latest OTP code for a mobile out of the API log (mock SMS provider). */
export function readOtpFromLog(mobile: string, timeoutMs = 15000): string {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const code = latestOtp(mobile);
    if (code) return code;
    sleep(300);
  }
  throw new Error(
    `no OTP code for ${mobile} in ${API_LOG}. The API must run with APP_ENV=development so the mock SMS provider logs codes.`,
  );
}

function latestOtp(mobile: string): string | null {
  if (!fs.existsSync(API_LOG)) return null;
  const lines = fs.readFileSync(API_LOG, "utf8").split("\n");
  // the log can hold interleaved entries from restarted API processes, so scan
  // everything and keep the freshest code rather than trusting line order
  let best: { at: number; code: string } | null = null;
  for (const line of lines) {
    if (!line.includes("mock sms sent") || !line.includes(mobile)) continue;
    let at = 0;
    let code: string | null = null;
    try {
      const parsed = JSON.parse(line) as { to?: string; text?: string; time?: string };
      if (parsed.to !== mobile) continue;
      at = parsed.time ? new Date(parsed.time).getTime() : 0;
      code = (parsed.text ?? "").match(/(\d{6})/)?.[1] ?? null;
    } catch {
      code = line.match(/(\d{6})/)?.[1] ?? null;
    }
    if (code && (!best || at > best.at)) best = { at, code };
  }
  // codes expire after two minutes; a leftover line from an earlier run must
  // never be submitted, so only accept a fresh one
  if (best && Date.now() - best.at <= 90_000) return best.code;
  return null;
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Iranian mobile number that is valid but unused in the dev database. */
export function uniqueMobile(): string {
  for (let i = 0; i < 50; i++) {
    const digits = String(Math.floor(10000000 + Math.random() * 89999999));
    const mobile = `091${digits}`;
    if (!USED_MOBILES.has(mobile)) {
      USED_MOBILES.add(mobile);
      return mobile;
    }
  }
  throw new Error("could not generate a unique mobile");
}
const USED_MOBILES = new Set<string>();

/** Cookie header + CSRF token so an API context can act as a signed-in user. */
export function authHeaders(cookies: Cookie[]): Record<string, string> {
  const csrf = cookies.find((c) => c.name === "gl_csrf")?.value ?? "";
  const cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  return { "X-CSRF-Token": csrf, Cookie: cookie };
}

/** Fills the six separate OTP boxes and waits for the auto-submit. */
export async function fillOtp(page: Page, code: string): Promise<void> {
  const boxes = page.locator('[role="group"][aria-label="کد تأیید"] input');
  await boxes.first().waitFor({ state: "visible" });
  const count = await boxes.count();
  for (let i = 0; i < count; i++) {
    await boxes.nth(i).fill(code[i] ?? "");
  }
}

/** Fixture files used by the media upload tests. */
export const FIXTURE_MP4 = path.join(__dirname, "..", "fixtures", "sample.mp4");
export const FIXTURE_PNG = path.join(__dirname, "..", "fixtures", "sample.png");

/** Uploads a file through the admin media API (presign → PUT → register). */
export async function uploadMedia(
  ctx: APIRequestContext,
  filePath: string,
  mime: string,
  cookies: Cookie[],
): Promise<{ id: string; storage_key: string }> {
  const headers = authHeaders(cookies);
  const bytes = fs.readFileSync(filePath);

  const presign = await ctx.post(`${API_URL}/api/v1/admin/media/presign`, {
    headers,
    data: { mime, size_bytes: bytes.length },
  });
  if (!presign.ok()) {
    throw new Error(`media presign failed: ${presign.status()} ${await presign.text()}`);
  }
  const ticket = (await presign.json()) as { upload_url: string; storage_key: string };

  const put = await ctx.put(ticket.upload_url, {
    headers: { "Content-Type": mime },
    data: bytes,
  });
  if (!put.ok()) {
    throw new Error(`media upload failed: ${put.status()} ${await put.text()}`);
  }

  const register = await ctx.post(`${API_URL}/api/v1/admin/media`, {
    headers,
    data: {
      storage_key: ticket.storage_key,
      filename: path.basename(filePath),
      mime,
      size_bytes: bytes.length,
      checksum: "",
    },
  });
  if (!register.ok()) {
    throw new Error(`media register failed: ${register.status()} ${await register.text()}`);
  }
  return (await register.json()) as { id: string; storage_key: string };
}

/** Waits until the background worker marked the asset as ready. */
export async function waitForMediaReady(
  ctx: APIRequestContext,
  storageKey: string,
  cookies: Cookie[],
  timeoutMs = 45000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let last = "unknown";
  const headers = authHeaders(cookies);
  while (Date.now() < deadline) {
    const res = await ctx.get(`${API_URL}/api/v1/admin/media?per_page=100`, { headers });
    if (res.ok()) {
      const body = (await res.json()) as { data: { storage_key: string; status: string }[] };
      const asset = body.data.find((m) => m.storage_key === storageKey);
      if (asset) {
        last = asset.status;
        if (asset.status === "ready") return asset.status;
        if (asset.status === "failed") break;
      }
    }
    sleep(500);
  }
  throw new Error(`media ${storageKey} never became ready (last status: ${last})`);
}

/** Logs in through the real UI and waits for the dashboard. */
export async function loginThroughUi(page: Page, mobile: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("شماره موبایل").fill(mobile);
  await page.getByLabel("رمز عبور").fill(password);
  // the navbar carries a "ورود" button too — target the form submit
  await page.locator("form").getByRole("button", { name: "ورود", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

/**
 * Creates a published course through the admin API (course → section → ready
 * lesson → publish) so a spec always owns a course nobody has bought yet.
 */
export async function createPublishedCourse(
  ctx: APIRequestContext,
  title: string,
  cookies: Cookie[],
): Promise<{ id: string; slug: string }> {
  const slug = `e2e-${Date.now().toString(36)}`;
  const headers = authHeaders(cookies);

  const course = await ctx.post(`${API_URL}/api/v1/admin/courses`, {
    headers,
    data: {
      title,
      slug,
      summary: "دورهٔ ساخته‌شده توسط تست خودکار E2E.",
      description_html: "<p>محتوای تست E2E</p>",
      level: "beginner",
      price_rial: 200000,
      outcomes: ["آزمون خودکار"],
    },
  });
  if (!course.ok()) {
    throw new Error(`course create failed: ${course.status()} ${await course.text()}`);
  }
  const courseBody = (await course.json()) as { id: string; slug: string };

  const section = await ctx.post(`${API_URL}/api/v1/admin/courses/${courseBody.id}/sections`, {
    headers,
    data: { title: "بخش تست" },
  });
  if (!section.ok()) {
    throw new Error(`section create failed: ${section.status()} ${await section.text()}`);
  }
  const sectionBody = (await section.json()) as { id: string };

  const lesson = await ctx.post(`${API_URL}/api/v1/admin/sections/${sectionBody.id}/lessons`, {
    headers,
    data: {
      title: "درس تست",
      content_html: "<p>متن درس تست</p>",
      position: 1,
      is_preview: true,
      duration_seconds: 60,
      status: "ready",
    },
  });
  if (!lesson.ok()) {
    throw new Error(`lesson create failed: ${lesson.status()} ${await lesson.text()}`);
  }

  const publish = await ctx.post(`${API_URL}/api/v1/admin/courses/${courseBody.id}/publish`, { headers });
  if (!publish.ok()) {
    throw new Error(`course publish failed: ${publish.status()} ${await publish.text()}`);
  }
  return { id: courseBody.id, slug: courseBody.slug };
}
