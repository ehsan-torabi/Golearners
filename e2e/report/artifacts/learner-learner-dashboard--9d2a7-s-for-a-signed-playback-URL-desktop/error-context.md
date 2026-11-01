# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learner.spec.ts >> learner dashboard >> the course player lists the lessons and asks for a signed playback URL
- Location: specs/learner.spec.ts:93:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]: "{\"error\":{\"code\":\"INTERNAL_ERROR\",\"message\":\"خطای غیرمنتظره رخ داد؛ لطفاً دوباره تلاش کنید.\"}}"
```

# Test source

```ts
  2   |   ADMIN_STATE,
  3   |   API_URL,
  4   |   createPublishedCourse,
  5   |   expect,
  6   |   expectNoClientErrors,
  7   |   FIXTURE_MP4,
  8   |   LEARNER_STATE,
  9   |   readOtpFromLog,
  10  |   test,
  11  |   uniqueMobile,
  12  |   uploadMedia,
  13  |   waitForMediaReady,
  14  | } from "../lib/helpers";
  15  | 
  16  | test.describe("learner dashboard", () => {
  17  |   test.use({ storageState: LEARNER_STATE });
  18  | 
  19  |   const stamp = Date.now();
  20  |   let playableSlug = "";
  21  |   let lessonTitle = "";
  22  |   let plainSlug = "";
  23  | 
  24  |   test.beforeAll(async ({ playwright }) => {
  25  |     const adminCtx = await playwright.request.newContext({
  26  |       baseURL: API_URL,
  27  |       storageState: ADMIN_STATE,
  28  |     });
  29  | 
  30  |     // a course whose lesson carries real media so the player can sign a URL
  31  |     const asset = await uploadMedia(adminCtx, FIXTURE_MP4, "video/mp4");
  32  |     await waitForMediaReady(adminCtx, asset.storage_key);
  33  | 
  34  |     const csrf = (await adminCtx.storageState()).cookies.find((c) => c.name === "gl_csrf")?.value ?? "";
  35  |     const headers = { "X-CSRF-Token": csrf };
  36  |     const title = `دورهٔ پخش تست ${stamp}`;
  37  | 
  38  |     const courseRes = await adminCtx.post("/api/v1/admin/courses", {
  39  |       headers,
  40  |       data: {
  41  |         title,
  42  |         slug: `e2e-play-${stamp}`,
  43  |         summary: "دورهٔ تست پخش",
  44  |         description_html: "<p>محتوای تست</p>",
  45  |         level: "beginner",
  46  |         price_rial: 300000,
  47  |         outcomes: ["تست پخش"],
  48  |       },
  49  |     });
  50  |     const course = (await courseRes.json()) as { id: string; slug: string };
  51  | 
  52  |     const sectionRes = await adminCtx.post(`/api/v1/admin/courses/${course.id}/sections`, {
  53  |       headers,
  54  |       data: { title: "بخش پخش" },
  55  |     });
  56  |     const section = (await sectionRes.json()) as { id: string };
  57  | 
  58  |     lessonTitle = `درس پخش ${stamp}`;
  59  |     await adminCtx.post(`/api/v1/admin/sections/${section.id}/lessons`, {
  60  |       headers,
  61  |       data: {
  62  |         title: lessonTitle,
  63  |         content_html: "<p>متن درس</p>",
  64  |         position: 1,
  65  |         is_preview: true,
  66  |         duration_seconds: 120,
  67  |         status: "ready",
  68  |         media_id: asset.id,
  69  |       },
  70  |     });
  71  |     await adminCtx.post(`/api/v1/admin/courses/${course.id}/publish`, { headers });
  72  |     playableSlug = course.slug;
  73  | 
  74  |     // a second, media-less course used by the orders test
  75  |     plainSlug = (await createPublishedCourse(adminCtx, `دورهٔ سفارش تست ${stamp}`)).slug;
  76  | 
  77  |     await adminCtx.dispose();
  78  |   });
  79  | 
  80  |   test("the dashboard shows the profile and the learning stats", async ({ page, diag }) => {
  81  |     await page.goto("/dashboard");
  82  | 
  83  |     await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
  84  |     await expect(page.getByText("دوره‌ها", { exact: true })).toBeVisible();
  85  |     await expect(page.getByText("در حال یادگیری")).toBeVisible();
  86  |     await expect(page.getByText("تکمیل‌شده")).toBeVisible();
  87  |     await expect(page.getByText("میانگین پیشرفت")).toBeVisible();
  88  |     await expect(page.getByRole("heading", { name: "دوره‌های من" })).toBeVisible();
  89  | 
  90  |     expectNoClientErrors(diag);
  91  |   });
  92  | 
  93  |   test("the course player lists the lessons and asks for a signed playback URL", async ({
  94  |     page,
  95  |     diag,
  96  |   }) => {
  97  |     await page.goto(`/checkout?course=${playableSlug}`);
  98  |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  99  |     await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
  100 |     await page.waitForURL(/localhost:8082/, { timeout: 20000 });
  101 |     await page.getByRole("link", { name: "پرداخت موفق" }).click();
> 102 |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  103 | 
  104 |     await page.goto(`/dashboard/courses/${playableSlug}`);
  105 | 
  106 |     await expect(page.getByRole("heading", { name: lessonTitle })).toBeVisible();
  107 |     await expect(page.getByRole("heading", { name: "سرفصل‌ها" })).toBeVisible();
  108 |     await expect(page.locator("video")).toBeVisible();
  109 | 
  110 |     await expect
  111 |       .poll(() => diag.apiCalls.filter((c) => c.includes("/playback/lessons/")), {
  112 |         timeout: 15000,
  113 |       })
  114 |       .toContain("200 GET");
  115 |     expect(diag.apiCalls.filter((c) => c.includes("/playback/lessons/")).join("\n")).toContain("200");
  116 | 
  117 |     expectNoClientErrors(diag);
  118 |   });
  119 | 
  120 |   test("the player stores the playback progress", async ({ page, diag }) => {
  121 |     await page.goto(`/dashboard/courses/${playableSlug}`);
  122 |     await expect(page.locator("video")).toBeVisible();
  123 | 
  124 |     await page.evaluate(() => {
  125 |       document.querySelector("video")?.dispatchEvent(new Event("pause"));
  126 |     });
  127 | 
  128 |     await expect
  129 |       .poll(() => diag.apiCalls.filter((c) => c.includes("/me/progress/")), { timeout: 15000 })
  130 |       .not.toHaveLength(0);
  131 |     expect(diag.apiCalls.filter((c) => c.includes("/me/progress/")).join("\n")).toContain("200");
  132 |   });
  133 | 
  134 |   test("the orders page lists a paid order", async ({ page, diag }) => {
  135 |     await page.goto(`/checkout?course=${plainSlug}`);
  136 |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  137 |     await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
  138 |     await page.waitForURL(/localhost:8082/, { timeout: 20000 });
  139 |     await page.getByRole("link", { name: "پرداخت موفق" }).click();
  140 |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
  141 | 
  142 |     await page.goto("/dashboard/orders");
  143 | 
  144 |     await expect(page.getByRole("heading", { name: "سفارش‌های من" })).toBeVisible();
  145 |     await expect(page.getByText("پرداخت‌شده").first()).toBeVisible();
  146 |     expectNoClientErrors(diag);
  147 |   });
  148 | 
  149 |   test("the profile page shows the account information", async ({ page, diag }) => {
  150 |     await page.goto("/dashboard/profile");
  151 | 
  152 |     await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
  153 |     await expect(page.getByRole("heading", { name: "اطلاعات حساب" })).toBeVisible();
  154 |     await expect(page.getByText("شماره موبایل")).toBeVisible();
  155 |     await expect(page.getByText("وضعیت حساب")).toBeVisible();
  156 |     await expect(page.getByText("فعال").first()).toBeVisible();
  157 | 
  158 |     expectNoClientErrors(diag);
  159 |   });
  160 | 
  161 |   test("the sidebar reaches every learner section", async ({ page, diag }) => {
  162 |     await page.goto("/dashboard");
  163 | 
  164 |     await page.getByRole("link", { name: "سفارش‌های من" }).click();
  165 |     await expect(page).toHaveURL(/\/dashboard\/orders$/);
  166 | 
  167 |     await page.getByRole("link", { name: "پروفایل" }).click();
  168 |     await expect(page).toHaveURL(/\/dashboard\/profile$/);
  169 | 
  170 |     await page.getByRole("link", { name: "دوره‌های من" }).click();
  171 |     await expect(page).toHaveURL(/\/dashboard$/);
  172 | 
  173 |     expectNoClientErrors(diag);
  174 |   });
  175 | 
  176 |   test("a learner can change the password and sign in with the new one", async ({
  177 |     page,
  178 |     diag,
  179 |     playwright,
  180 |   }) => {
  181 |     const mobile = uniqueMobile();
  182 |     const api = await playwright.request.newContext({ baseURL: API_URL });
  183 |     await api.post("/api/v1/auth/register", {
  184 |       data: { full_name: "کاربر رمز تست", mobile, password: "OldPass2026" },
  185 |     });
  186 |     await api.post("/api/v1/auth/otp/verify", {
  187 |       data: { mobile, code: readOtpFromLog(mobile), purpose: "verify" },
  188 |     });
  189 |     const cookies = (await api.storageState()).cookies;
  190 |     await api.dispose();
  191 | 
  192 |     await page.context().clearCookies();
  193 |     await page.context().addCookies(cookies);
  194 | 
  195 |     await page.goto("/dashboard/profile");
  196 |     await page.locator("#pw-current").fill("OldPass2026");
  197 |     await page.locator("#pw-next").fill("NewPass2026");
  198 |     await page.getByRole("button", { name: "ذخیره رمز تازه" }).click();
  199 | 
  200 |     await expect(page.getByText("رمز عبور با موفقیت تغییر کرد")).toBeVisible();
  201 | 
  202 |     // the old password no longer works, the new one does
```