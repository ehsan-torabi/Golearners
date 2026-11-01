# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learner.spec.ts >> learner dashboard >> the orders page lists a paid order
- Location: specs/learner.spec.ts:134:7

# Error details

```
Error: media register failed: 400 {"error":{"code":"VALIDATION_ERROR","message":"اطلاعات ارسالی نامعتبر است."}}

```

# Test source

```ts
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
  185 |     headers: { "X-CSRF-Token": csrf },
  186 |     data: {
  187 |       storage_key: ticket.storage_key,
  188 |       filename: path.basename(filePath),
  189 |       mime,
  190 |       size_bytes: bytes.length,
  191 |       checksum: "",
  192 |     },
  193 |   });
  194 |   if (!register.ok()) {
> 195 |     throw new Error(`media register failed: ${register.status()} ${await register.text()}`);
      |           ^ Error: media register failed: 400 {"error":{"code":"VALIDATION_ERROR","message":"اطلاعات ارسالی نامعتبر است."}}
  196 |   }
  197 |   return (await register.json()) as { id: string; storage_key: string };
  198 | }
  199 | 
  200 | /** Waits until the background worker marked the asset as ready. */
  201 | export async function waitForMediaReady(
  202 |   ctx: APIRequestContext,
  203 |   storageKey: string,
  204 |   timeoutMs = 45000,
  205 | ): Promise<string> {
  206 |   const deadline = Date.now() + timeoutMs;
  207 |   let last = "unknown";
  208 |   while (Date.now() < deadline) {
  209 |     const res = await ctx.get(`${API_URL}/api/v1/admin/media?per_page=100`);
  210 |     if (res.ok()) {
  211 |       const body = (await res.json()) as { data: { storage_key: string; status: string }[] };
  212 |       const asset = body.data.find((m) => m.storage_key === storageKey);
  213 |       if (asset) {
  214 |         last = asset.status;
  215 |         if (asset.status === "ready") return asset.status;
  216 |         if (asset.status === "failed") break;
  217 |       }
  218 |     }
  219 |     sleep(500);
  220 |   }
  221 |   throw new Error(`media ${storageKey} never became ready (last status: ${last})`);
  222 | }
  223 | 
  224 | /** Logs in through the real UI and waits for the dashboard. */
  225 | export async function loginThroughUi(page: Page, mobile: string, password: string): Promise<void> {
  226 |   await page.goto("/login");
  227 |   await page.getByLabel("شماره موبایل").fill(mobile);
  228 |   await page.getByLabel("رمز عبور").fill(password);
  229 |   await page.getByRole("button", { name: "ورود", exact: true }).click();
  230 |   await page.waitForURL("**/dashboard", { timeout: 20000 });
  231 | }
  232 | 
  233 | /**
  234 |  * Creates a published course through the admin API (course → section → ready
  235 |  * lesson → publish) so a spec always owns a course nobody has bought yet.
  236 |  */
  237 | export async function createPublishedCourse(
  238 |   ctx: APIRequestContext,
  239 |   title: string,
  240 | ): Promise<{ id: string; slug: string }> {
  241 |   const csrf = await csrfToken(ctx);
  242 |   const slug = `e2e-${Date.now().toString(36)}`;
  243 |   const headers = { "X-CSRF-Token": csrf };
  244 | 
  245 |   const course = await ctx.post(`${API_URL}/api/v1/admin/courses`, {
  246 |     headers,
  247 |     data: {
  248 |       title,
  249 |       slug,
  250 |       summary: "دورهٔ ساخته‌شده توسط تست خودکار E2E.",
  251 |       description_html: "<p>محتوای تست E2E</p>",
  252 |       level: "beginner",
  253 |       price_rial: 200000,
  254 |       outcomes: ["آزمون خودکار"],
  255 |     },
  256 |   });
  257 |   if (!course.ok()) {
  258 |     throw new Error(`course create failed: ${course.status()} ${await course.text()}`);
  259 |   }
  260 |   const courseBody = (await course.json()) as { id: string; slug: string };
  261 | 
  262 |   const section = await ctx.post(`${API_URL}/api/v1/admin/courses/${courseBody.id}/sections`, {
  263 |     headers,
  264 |     data: { title: "بخش تست" },
  265 |   });
  266 |   if (!section.ok()) {
  267 |     throw new Error(`section create failed: ${section.status()} ${await section.text()}`);
  268 |   }
  269 |   const sectionBody = (await section.json()) as { id: string };
  270 | 
  271 |   const lesson = await ctx.post(`${API_URL}/api/v1/admin/sections/${sectionBody.id}/lessons`, {
  272 |     headers,
  273 |     data: {
  274 |       title: "درس تست",
  275 |       content_html: "<p>متن درس تست</p>",
  276 |       position: 1,
  277 |       is_preview: true,
  278 |       duration_seconds: 60,
  279 |       status: "ready",
  280 |     },
  281 |   });
  282 |   if (!lesson.ok()) {
  283 |     throw new Error(`lesson create failed: ${lesson.status()} ${await lesson.text()}`);
  284 |   }
  285 | 
  286 |   const publish = await ctx.post(`${API_URL}/api/v1/admin/courses/${courseBody.id}/publish`, { headers });
  287 |   if (!publish.ok()) {
  288 |     throw new Error(`course publish failed: ${publish.status()} ${await publish.text()}`);
  289 |   }
  290 |   return { id: courseBody.id, slug: courseBody.slug };
  291 | }
  292 | 
```