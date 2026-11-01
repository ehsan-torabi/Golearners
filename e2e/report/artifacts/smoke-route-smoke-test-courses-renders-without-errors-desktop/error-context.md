# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> route smoke test >> /courses renders without errors
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
              - link "دوره‌ها" [disabled] [ref=e46]
      - generic [ref=e47]:
        - heading "دوره‌ها" [level=1] [ref=e48]
        - paragraph [ref=e49]: هر دوره ویدیویی، پروژه‌محور و با دسترسی مادام‌العمر. سطح و موضوع را انتخاب کن.
      - search [ref=e50]:
        - generic [ref=e51]:
          - generic [ref=e52] [cursor=pointer]: جست‌وجو
          - textbox "جست‌وجو" [ref=e53]:
            - /placeholder: مثلاً گولنگ
        - generic [ref=e54]:
          - generic [ref=e55] [cursor=pointer]: موضوع
          - combobox "موضوع" [ref=e56] [cursor=pointer]:
            - option "همه موضوع‌ها" [selected]
        - generic [ref=e57]:
          - generic [ref=e58] [cursor=pointer]: سطح
          - combobox "سطح" [ref=e59] [cursor=pointer]:
            - option "همه سطح‌ها" [selected]
            - option "مقدماتی"
            - option "متوسط"
            - option "پیشرفته"
        - button "اعمال فیلتر" [ref=e60] [cursor=pointer]
      - paragraph [ref=e61]: ۱۱ دوره
      - generic [ref=e62]:
        - link "دورهٔ سفارش تست 1793576467314 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e64] [cursor=pointer]:
          - /url: /courses/e2e-mvyh4lat
          - generic [aria-hidden] [ref=e66]: دو
          - generic [ref=e67]:
            - generic [ref=e68]:
              - heading "دورهٔ سفارش تست 1793576467314" [level=3] [ref=e69]
              - generic [ref=e70]: مقدماتی
            - paragraph [ref=e71]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e72]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ پخش تست 1793576467314 مقدماتی دورهٔ تست پخش ۳۰٬۰۰۰ تومان" [ref=e75] [cursor=pointer]:
          - /url: /courses/e2e-play-1793576467314
          - generic [aria-hidden] [ref=e77]: دو
          - generic [ref=e78]:
            - generic [ref=e79]:
              - heading "دورهٔ پخش تست 1793576467314" [level=3] [ref=e80]
              - generic [ref=e81]: مقدماتی
            - paragraph [ref=e82]: دورهٔ تست پخش
            - generic [ref=e83]: ۳۰٬۰۰۰ تومان
        - link "دورهٔ سفارش تست 1793576426056 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e86] [cursor=pointer]:
          - /url: /courses/e2e-mvyh3qln
          - generic [aria-hidden] [ref=e88]: دو
          - generic [ref=e89]:
            - generic [ref=e90]:
              - heading "دورهٔ سفارش تست 1793576426056" [level=3] [ref=e91]
              - generic [ref=e92]: مقدماتی
            - paragraph [ref=e93]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e94]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ پخش تست 1793576426056 مقدماتی دورهٔ تست پخش ۳۰٬۰۰۰ تومان" [ref=e97] [cursor=pointer]:
          - /url: /courses/e2e-play-1793576426056
          - generic [aria-hidden] [ref=e99]: دو
          - generic [ref=e100]:
            - generic [ref=e101]:
              - heading "دورهٔ پخش تست 1793576426056" [level=3] [ref=e102]
              - generic [ref=e103]: مقدماتی
            - paragraph [ref=e104]: دورهٔ تست پخش
            - generic [ref=e105]: ۳۰٬۰۰۰ تومان
        - link "دورهٔ تخفیف تست 1793576421924 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e108] [cursor=pointer]:
          - /url: /courses/e2e-mvyh3cbr
          - generic [aria-hidden] [ref=e110]: دو
          - generic [ref=e111]:
            - generic [ref=e112]:
              - heading "دورهٔ تخفیف تست 1793576421924" [level=3] [ref=e113]
              - generic [ref=e114]: مقدماتی
            - paragraph [ref=e115]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e116]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ لغوشده تست 1793576392357 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e119] [cursor=pointer]:
          - /url: /courses/e2e-mvyh2pif
          - generic [aria-hidden] [ref=e121]: دو
          - generic [ref=e122]:
            - generic [ref=e123]:
              - heading "دورهٔ لغوشده تست 1793576392357" [level=3] [ref=e124]
              - generic [ref=e125]: مقدماتی
            - paragraph [ref=e126]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e127]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ تکراری تست 1793576369531 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e130] [cursor=pointer]:
          - /url: /courses/e2e-mvyh27we
          - generic [aria-hidden] [ref=e132]: دو
          - generic [ref=e133]:
            - generic [ref=e134]:
              - heading "دورهٔ تکراری تست 1793576369531" [level=3] [ref=e135]
              - generic [ref=e136]: مقدماتی
            - paragraph [ref=e137]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e138]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ خرید تست 1793576344537 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e141] [cursor=pointer]:
          - /url: /courses/e2e-mvyh1om5
          - generic [aria-hidden] [ref=e143]: دو
          - generic [ref=e144]:
            - generic [ref=e145]:
              - heading "دورهٔ خرید تست 1793576344537" [level=3] [ref=e146]
              - generic [ref=e147]: مقدماتی
            - paragraph [ref=e148]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e149]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ بازگشت وجه تست 1793576240749 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان" [ref=e152] [cursor=pointer]:
          - /url: /courses/e2e-mvygzgom
          - generic [aria-hidden] [ref=e154]: دو
          - generic [ref=e155]:
            - generic [ref=e156]:
              - heading "دورهٔ بازگشت وجه تست 1793576240749" [level=3] [ref=e157]
              - generic [ref=e158]: مقدماتی
            - paragraph [ref=e159]: دورهٔ ساخته‌شده توسط تست خودکار E2E.
            - generic [ref=e160]: ۲۰٬۰۰۰ تومان
        - link "دورهٔ آزمایشی تازه متوسط خلاصهٔ آزمایشی ۲۵٪ تخفیف ۱۵٬۰۰۰ تومان ۲۰٬۰۰۰ تومان" [ref=e163] [cursor=pointer]:
          - /url: /courses/%D8%AF%D9%88%D8%B1%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C-%D8%AA%D8%A7%D8%B2%D9%87
          - generic [aria-hidden] [ref=e165]: دو
          - generic [ref=e166]:
            - generic [ref=e167]:
              - heading "دورهٔ آزمایشی تازه" [level=3] [ref=e168]
              - generic [ref=e169]: متوسط
            - paragraph [ref=e170]: خلاصهٔ آزمایشی
            - generic [ref=e171]: ۲۵٪ تخفیف
            - generic [ref=e173]:
              - generic [ref=e174]: ۱۵٬۰۰۰ تومان
              - generic [ref=e175]: ۲۰٬۰۰۰ تومان
        - link "آموزش Go از صفر مقدماتی ساخت وب‌سرور واقعی با Go ۲۵۰٬۰۰۰ تومان" [ref=e177] [cursor=pointer]:
          - /url: /courses/go-from-zero
          - generic [aria-hidden] [ref=e179]: آم
          - generic [ref=e180]:
            - generic [ref=e181]:
              - heading "آموزش Go از صفر" [level=3] [ref=e182]
              - generic [ref=e183]: مقدماتی
            - paragraph [ref=e184]: ساخت وب‌سرور واقعی با Go
            - generic [ref=e185]: ۲۵۰٬۰۰۰ تومان
  - contentinfo [ref=e187]:
    - generic [ref=e188]:
      - generic [ref=e189]:
        - paragraph [ref=e190]: گوLearn
        - paragraph [ref=e191]: دوره‌های ویدیویی برنامه‌نویسی به فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.
      - navigation "ناوبری پابرگ" [ref=e192]:
        - link "دوره‌ها" [ref=e193] [cursor=pointer]:
          - /url: /courses
        - link "وبلاگ" [ref=e194] [cursor=pointer]:
          - /url: /blog
        - link "درباره مدرس" [ref=e195] [cursor=pointer]:
          - /url: /instructor
        - link "تماس" [ref=e196] [cursor=pointer]:
          - /url: /contact
        - link "support@golearn.ir" [ref=e197] [cursor=pointer]:
          - /url: mailto:support@golearn.ir
    - generic [ref=e198]: گوLearn ،۱۴۰۵. همه محتوا متعلق به این رسانه است.
  - alert [ref=e199]
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