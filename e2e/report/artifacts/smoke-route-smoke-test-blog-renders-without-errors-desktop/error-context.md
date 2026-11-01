# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> route smoke test >> /blog renders without errors
- Location: specs/smoke.spec.ts:22:9

# Error details

```
Error: client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 7

- Array []
+ Array [
+   "Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:
+
+ - A server/client branch `if (typeof window !== 'undefined')`.
+ - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
+ - Date formatting in a user's locale which doesn't m",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [aria-hidden] [ref=e14]: "3"
          - generic [ref=e15]: "4"
        - generic [ref=e16]:
          - text: Issue
          - generic [aria-hidden] [ref=e17]: s
      - button "Collapse issues badge" [ref=e18]
  - banner [ref=e21]:
    - generic [ref=e22]:
      - link "گوLearn" [ref=e23] [cursor=pointer]:
        - /url: /
      - navigation "ناوبری اصلی" [ref=e24]:
        - link "دوره‌ها" [ref=e25] [cursor=pointer]:
          - /url: /courses
        - link "وبلاگ" [ref=e26] [cursor=pointer]:
          - /url: /blog
        - link "درباره مدرس" [ref=e27] [cursor=pointer]:
          - /url: /instructor
        - link "تماس" [ref=e28] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e29]:
        - button "تغییر تم روشن و تاریک" [ref=e30] [cursor=pointer]
        - link "ورود" [ref=e34] [cursor=pointer]:
          - /url: /login
  - main [ref=e35]:
    - generic [ref=e36]:
      - navigation "مسیر صفحه" [ref=e37]:
        - navigation "مسیر صفحه" [ref=e38]:
          - list [ref=e39]:
            - listitem [ref=e40]:
              - link "خانه" [ref=e41] [cursor=pointer]:
                - /url: /
              - listitem [aria-hidden] [ref=e42]
            - listitem [ref=e45]:
              - link "وبلاگ" [disabled] [ref=e46]
      - generic [ref=e47]:
        - heading "وبلاگ" [level=1] [ref=e48]
        - paragraph [ref=e49]: یادداشت‌های آموزشی درباره برنامه‌نویسی، از مقدمات تا نکته‌های حرفه‌ای.
      - list [ref=e50]:
        - listitem [ref=e51]:
          - link [ref=e52] [cursor=pointer]:
            - /url: /blog/%D9%86%D9%88%D8%B4%D8%AA%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C
            - time [ref=e53]: ۱۱ آبان ۱۴۰۵
            - generic [ref=e54]:
              - heading "نوشتهٔ آزمایشی" [level=2] [ref=e55]
              - paragraph [ref=e56]: چکیده
              - paragraph [ref=e57]: ۴ دقیقه مطالعه
  - contentinfo [ref=e58]:
    - generic [ref=e59]:
      - generic [ref=e60]:
        - paragraph [ref=e61]: گوLearn
        - paragraph [ref=e62]: دوره‌های ویدیویی برنامه‌نویسی به فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.
      - navigation "ناوبری پابرگ" [ref=e63]:
        - link "دوره‌ها" [ref=e64] [cursor=pointer]:
          - /url: /courses
        - link "وبلاگ" [ref=e65] [cursor=pointer]:
          - /url: /blog
        - link "درباره مدرس" [ref=e66] [cursor=pointer]:
          - /url: /instructor
        - link "تماس" [ref=e67] [cursor=pointer]:
          - /url: /contact
        - link "support@golearn.ir" [ref=e68] [cursor=pointer]:
          - /url: mailto:support@golearn.ir
    - generic [ref=e69]: گوLearn ،۱۴۰۵. همه محتوا متعلق به این رسانه است.
  - alert [ref=e70]
```

# Test source

```ts
  1   | import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";
  2   | import fs from "node:fs";
  3   | import path from "node:path";
  4   | 
  5   | export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080";
  6   | export const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";
  7   | export const API_LOG = process.env.E2E_API_LOG ?? "/tmp/golearn-api.log";
  8   | 
  9   | export const OWNER = { mobile: "09121234567", password: "GoLearn2026!" };
  10  | export const LEARNER = { mobile: "09190000001", password: "Learner2026!" };
  11  | 
  12  | /** A published course that exists in every environment (created by the seed/admin flow). */
  13  | export const COURSE_SLUG = process.env.E2E_COURSE_SLUG ?? "go-from-zero";
  14  | /** Coupon created by the global setup so the checkout spec can test discounts. */
  15  | export const COUPON_CODE = process.env.E2E_COUPON_CODE ?? "E2E10";
  16  | 
  17  | /** Playwright storage states written by the global setup. */
  18  | export const LEARNER_STATE = path.join(__dirname, "..", "report", "state", "learner.json");
  19  | export const ADMIN_STATE = path.join(__dirname, "..", "report", "state", "admin.json");
  20  | 
  21  | export interface Diagnostics {
  22  |   consoleErrors: string[];
  23  |   pageErrors: string[];
  24  |   failedRequests: string[];
  25  |   serverErrors: string[];
  26  |   clientErrors: string[];
  27  |   apiCalls: string[];
  28  | }
  29  | 
  30  | const diagnostics = new Map<string, Diagnostics>();
  31  | 
  32  | export function diagnosticsOf(testId: string): Diagnostics {
  33  |   return (
  34  |     diagnostics.get(testId) ?? {
  35  |       consoleErrors: [],
  36  |       pageErrors: [],
  37  |       failedRequests: [],
  38  |       serverErrors: [],
  39  |       clientErrors: [],
  40  |       apiCalls: [],
  41  |     }
  42  |   );
  43  | }
  44  | 
  45  | /** Collects console errors, page exceptions and failed/4xx/5xx requests per test. */
  46  | export const test = base.extend<{ diag: Diagnostics }>({
  47  |   diag: async ({ page }, use, testInfo) => {
  48  |     const d: Diagnostics = {
  49  |       consoleErrors: [],
  50  |       pageErrors: [],
  51  |       failedRequests: [],
  52  |       serverErrors: [],
  53  |       clientErrors: [],
  54  |       apiCalls: [],
  55  |     };
  56  |     diagnostics.set(testInfo.testId, d);
  57  |     page.on("console", (m) => {
  58  |       if (m.type() === "error") d.consoleErrors.push(m.text().slice(0, 400));
  59  |     });
  60  |     page.on("pageerror", (e) => d.pageErrors.push(`${e.name}: ${e.message}`.slice(0, 400)));
  61  |     page.on("requestfailed", (r) =>
  62  |       d.failedRequests.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText ?? "failed"}`),
  63  |     );
  64  |     page.on("response", (r) => {
  65  |       const line = `${r.status()} ${r.request().method()} ${r.url()}`;
  66  |       if (r.url().includes("/api/")) d.apiCalls.push(line);
  67  |       if (r.status() >= 500) d.serverErrors.push(line);
  68  |       else if (r.status() >= 400) d.clientErrors.push(line);
  69  |     });
  70  |     await use(d);
  71  |     // the reporter reads the diagnostics from the attachment, not from a map
  72  |     await testInfo.attach("diagnostics", {
  73  |       body: JSON.stringify(d),
  74  |       contentType: "application/json",
  75  |     });
  76  |   },
  77  | });
  78  | 
  79  | export { expect };
  80  | 
  81  | /** Fails the test when the page logged errors — catches silent client-side breakage. */
  82  | export function expectNoClientErrors(diag: Diagnostics): void {
  83  |   const noise = [...diag.pageErrors, ...diag.serverErrors];
> 84  |   expect(noise, `client/server errors:\n${noise.join("\n")}`).toEqual([]);
      |                                                               ^ Error: client/server errors:
  85  | }
  86  | 
  87  | /** Reads the latest OTP code for a mobile out of the API log (mock SMS provider). */
  88  | export function readOtpFromLog(mobile: string, timeoutMs = 15000): string {
  89  |   const deadline = Date.now() + timeoutMs;
  90  |   while (Date.now() < deadline) {
  91  |     const code = latestOtp(mobile);
  92  |     if (code) return code;
  93  |     sleep(300);
  94  |   }
  95  |   throw new Error(
  96  |     `no OTP code for ${mobile} in ${API_LOG}. The API must run with APP_ENV=development so the mock SMS provider logs codes.`,
  97  |   );
  98  | }
  99  | 
  100 | function latestOtp(mobile: string): string | null {
  101 |   if (!fs.existsSync(API_LOG)) return null;
  102 |   const lines = fs.readFileSync(API_LOG, "utf8").split("\n");
  103 |   for (let i = lines.length - 1; i >= 0; i--) {
  104 |     const line = lines[i];
  105 |     if (!line.includes("mock sms sent") || !line.includes(mobile)) continue;
  106 |     try {
  107 |       const parsed = JSON.parse(line) as { to?: string; text?: string };
  108 |       if (parsed.to !== mobile) continue;
  109 |       const m = (parsed.text ?? "").match(/(\d{6})/);
  110 |       if (m) return m[1];
  111 |     } catch {
  112 |       const m = line.match(/(\d{6})/);
  113 |       if (m) return m[1];
  114 |     }
  115 |   }
  116 |   return null;
  117 | }
  118 | 
  119 | function sleep(ms: number): void {
  120 |   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  121 | }
  122 | 
  123 | /** Iranian mobile number that is valid but unused in the dev database. */
  124 | export function uniqueMobile(): string {
  125 |   for (let i = 0; i < 50; i++) {
  126 |     const digits = String(Math.floor(10000000 + Math.random() * 89999999));
  127 |     const mobile = `0913${digits}`;
  128 |     if (!USED_MOBILES.has(mobile)) {
  129 |       USED_MOBILES.add(mobile);
  130 |       return mobile;
  131 |     }
  132 |   }
  133 |   throw new Error("could not generate a unique mobile");
  134 | }
  135 | const USED_MOBILES = new Set<string>();
  136 | 
  137 | /** Reads the gl_csrf cookie so API mutations can pass the double-submit header. */
  138 | export async function csrfToken(ctx: APIRequestContext): Promise<string> {
  139 |   const state = await ctx.storageState();
  140 |   const cookie = state.cookies.find((c) => c.name === "gl_csrf");
  141 |   return cookie?.value ?? "";
  142 | }
  143 | 
  144 | /** Fills the six separate OTP boxes and waits for the auto-submit. */
  145 | export async function fillOtp(page: Page, code: string): Promise<void> {
  146 |   const boxes = page.locator('[role="group"][aria-label="کد تأیید"] input');
  147 |   await boxes.first().waitFor({ state: "visible" });
  148 |   const count = await boxes.count();
  149 |   for (let i = 0; i < count; i++) {
  150 |     await boxes.nth(i).fill(code[i] ?? "");
  151 |   }
  152 | }
  153 | 
  154 | /** Fixture files used by the media upload tests. */
  155 | export const FIXTURE_MP4 = path.join(__dirname, "..", "fixtures", "sample.mp4");
  156 | export const FIXTURE_PNG = path.join(__dirname, "..", "fixtures", "sample.png");
  157 | 
  158 | /** Uploads a file through the admin media API (presign → PUT → register). */
  159 | export async function uploadMedia(
  160 |   ctx: APIRequestContext,
  161 |   filePath: string,
  162 |   mime: string,
  163 | ): Promise<{ id: string; storage_key: string }> {
  164 |   const csrf = await csrfToken(ctx);
  165 |   const bytes = fs.readFileSync(filePath);
  166 | 
  167 |   const presign = await ctx.post(`${API_URL}/api/v1/admin/media/presign`, {
  168 |     headers: { "X-CSRF-Token": csrf },
  169 |     data: { mime, size_bytes: bytes.length },
  170 |   });
  171 |   if (!presign.ok()) {
  172 |     throw new Error(`media presign failed: ${presign.status()} ${await presign.text()}`);
  173 |   }
  174 |   const ticket = (await presign.json()) as { upload_url: string; storage_key: string };
  175 | 
  176 |   const put = await ctx.put(ticket.upload_url, {
  177 |     headers: { "Content-Type": mime },
  178 |     data: bytes,
  179 |   });
  180 |   if (!put.ok()) {
  181 |     throw new Error(`media upload failed: ${put.status()} ${await put.text()}`);
  182 |   }
  183 | 
  184 |   const register = await ctx.post(`${API_URL}/api/v1/admin/media`, {
```