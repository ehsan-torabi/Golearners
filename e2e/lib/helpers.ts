import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";
export const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";
export const API_LOG = process.env.E2E_API_LOG ?? "/tmp/golearn-api.log";

export const OWNER = { mobile: "09121234567", password: "GoLearn2026!" };
export const LEARNER = { mobile: "09190000001", password: "Learner2026!" };

/** A published course that exists in every environment (created by the seed/admin flow). */
export const COURSE_SLUG = process.env.E2E_COURSE_SLUG ?? "go-from-zero";
/** Coupon created by the global setup so the checkout spec can test discounts. */
export const COUPON_CODE = process.env.E2E_COUPON_CODE ?? "E2E10";

/** Playwright storage states written by the global setup. */
export const LEARNER_STATE = path.join(__dirname, "..", "report", "state", "learner.json");
export const ADMIN_STATE = path.join(__dirname, "..", "report", "state", "admin.json");

export interface Diagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  serverErrors: string[];
  clientErrors: string[];
  apiCalls: string[];
}

const diagnostics = new Map<string, Diagnostics>();

export function diagnosticsOf(testId: string): Diagnostics {
  return (
    diagnostics.get(testId) ?? {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      serverErrors: [],
      clientErrors: [],
      apiCalls: [],
    }
  );
}

/** Collects console errors, page exceptions and failed/4xx/5xx requests per test. */
export const test = base.extend<{ diag: Diagnostics }>({
  diag: async ({ page }, use, testInfo) => {
    const d: Diagnostics = {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      serverErrors: [],
      clientErrors: [],
      apiCalls: [],
    };
    diagnostics.set(testInfo.testId, d);
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
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.includes("mock sms sent") || !line.includes(mobile)) continue;
    try {
      const parsed = JSON.parse(line) as { to?: string; text?: string };
      if (parsed.to !== mobile) continue;
      const m = (parsed.text ?? "").match(/(\d{6})/);
      if (m) return m[1];
    } catch {
      const m = line.match(/(\d{6})/);
      if (m) return m[1];
    }
  }
  return null;
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Iranian mobile number that is valid but unused in the dev database. */
export function uniqueMobile(): string {
  for (let i = 0; i < 50; i++) {
    const digits = String(Math.floor(10000000 + Math.random() * 89999999));
    const mobile = `0913${digits}`;
    if (!USED_MOBILES.has(mobile)) {
      USED_MOBILES.add(mobile);
      return mobile;
    }
  }
  throw new Error("could not generate a unique mobile");
}
const USED_MOBILES = new Set<string>();

/** Reads the gl_csrf cookie so API mutations can pass the double-submit header. */
export async function csrfToken(ctx: APIRequestContext): Promise<string> {
  const state = await ctx.storageState();
  const cookie = state.cookies.find((c) => c.name === "gl_csrf");
  return cookie?.value ?? "";
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
): Promise<{ id: string; storage_key: string }> {
  const csrf = await csrfToken(ctx);
  const bytes = fs.readFileSync(filePath);

  const presign = await ctx.post(`${API_URL}/api/v1/admin/media/presign`, {
    headers: { "X-CSRF-Token": csrf },
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
    headers: { "X-CSRF-Token": csrf },
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
  timeoutMs = 45000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let last = "unknown";
  while (Date.now() < deadline) {
    const res = await ctx.get(`${API_URL}/api/v1/admin/media?per_page=100`);
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
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

/**
 * Creates a published course through the admin API (course → section → ready
 * lesson → publish) so a spec always owns a course nobody has bought yet.
 */
export async function createPublishedCourse(
  ctx: APIRequestContext,
  title: string,
): Promise<{ id: string; slug: string }> {
  const csrf = await csrfToken(ctx);
  const slug = `e2e-${Date.now().toString(36)}`;
  const headers = { "X-CSRF-Token": csrf };

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
