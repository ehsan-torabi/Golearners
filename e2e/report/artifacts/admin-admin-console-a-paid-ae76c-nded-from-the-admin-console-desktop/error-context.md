# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin console >> a paid order can be refunded from the admin console
- Location: specs/admin.spec.ts:209:7

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
  125 |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  126 | 
  127 |     const row = page.getByRole("row").filter({ hasText: postTitle });
  128 |     await expect(row).toHaveCount(1);
  129 |     await row.getByRole("button", { name: "انتشار" }).click();
  130 |     await expect(row.getByText("منتشرشده")).toBeVisible();
  131 | 
  132 |     // it shows up on the public blog
  133 |     await page.goto(`/blog/${postSlug}`);
  134 |     await expect(page.getByRole("heading", { name: postTitle })).toBeVisible();
  135 | 
  136 |     // and can be deleted again
  137 |     await page.goto("/admin/posts");
  138 |     await page.locator("#post-q").fill(postTitle);
  139 |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  140 |     const delRow = page.getByRole("row").filter({ hasText: postTitle });
  141 |     await delRow.getByRole("button", { name: "حذف" }).click();
  142 |     await page.getByRole("button", { name: "حذف نوشته" }).click();
  143 |     await expect(delRow).toHaveCount(0);
  144 | 
  145 |     expectNoClientErrors(diag);
  146 |   });
  147 | 
  148 |   test("a coupon is created and switched off", async ({ page, diag }) => {
  149 |     await page.goto("/admin/coupons");
  150 | 
  151 |     await page.getByRole("button", { name: "کد تازه" }).click();
  152 |     await page.locator("#c-code").fill(`E2E${String(stamp).slice(-5)}`);
  153 |     await page.locator("#c-type").selectOption("percent");
  154 |     await page.locator("#c-value").fill("15");
  155 |     await page.getByRole("button", { name: "ساخت کد تخفیف" }).click();
  156 | 
  157 |     const row = page.getByRole("row").filter({ hasText: `E2E${String(stamp).slice(-5)}` });
  158 |     await expect(row).toHaveCount(1);
  159 |     await expect(row.getByText("۱۵٪")).toBeVisible();
  160 | 
  161 |     await row.getByRole("button", { name: "غیرفعال کردن" }).click();
  162 |     await expect(row.getByText("غیرفعال")).toBeVisible();
  163 | 
  164 |     expectNoClientErrors(diag);
  165 |   });
  166 | 
  167 |   test("an admin can block and unblock a user", async ({ page, diag, playwright }) => {
  168 |     const mobile = uniqueMobile();
  169 |     const api = await playwright.request.newContext({ baseURL: API_URL });
  170 |     await api.post("/api/v1/auth/register", {
  171 |       data: { full_name: "کاربر مسدود تست", mobile, password: "Blocked2026" },
  172 |     });
  173 |     await api.dispose();
  174 | 
  175 |     await page.goto("/admin/users");
  176 |     await page.getByLabel("جست‌وجوی کاربر").fill(mobile);
  177 |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  178 | 
  179 |     const row = page.getByRole("row").filter({ hasText: mobile });
  180 |     await expect(row).toHaveCount(1);
  181 |     await row.getByRole("button", { name: "مسدودسازی" }).click();
  182 |     await expect(row.getByText("مسدود")).toBeVisible();
  183 | 
  184 |     await row.getByRole("button", { name: "رفع مسدودی" }).click();
  185 |     await expect(row.getByText("فعال")).toBeVisible();
  186 | 
  187 |     expectNoClientErrors(diag);
  188 |   });
  189 | 
  190 |   test("a contact message reaches the admin inbox and can be closed", async ({ page, diag }) => {
  191 |     await page.request.post(`${API_URL}/api/v1/contact`, {
  192 |       data: {
  193 |         name: "کاربر پیام تست",
  194 |         contact: "09121110077",
  195 |         body: "این پیام برای تست خودکار مدیریت ارسال شده است.",
  196 |       },
  197 |     });
  198 | 
  199 |     await page.goto("/admin/messages");
  200 |     await expect(page.getByRole("heading", { name: "پیام‌های تماس" })).toBeVisible();
  201 |     await expect(page.getByText("کاربر پیام تست").first()).toBeVisible();
  202 | 
  203 |     await page.getByRole("button", { name: "بستن" }).first().click();
  204 |     await expect(page.getByText("بسته").first()).toBeVisible();
  205 | 
  206 |     expectNoClientErrors(diag);
  207 |   });
  208 | 
  209 |   test("a paid order can be refunded from the admin console", async ({ page, diag, browser }) => {
  210 |     // the learner buys a course so there is a paid order to refund
  211 |     const adminCtx = await browser.newContext({ storageState: ADMIN_STATE });
  212 |     const course = await createPublishedCourse(
  213 |       adminCtx.request,
  214 |       `دورهٔ بازگشت وجه تست ${stamp}`,
  215 |     );
  216 |     await adminCtx.close();
  217 | 
  218 |     const learnerCtx = await browser.newContext({ storageState: LEARNER_STATE });
  219 |     const buyer = await learnerCtx.newPage();
  220 |     await buyer.goto(`/checkout?course=${course.slug}`);
  221 |     await buyer.getByText("قابل پرداخت").waitFor();
  222 |     await buyer.getByRole("button", { name: "درگاه آزمایشی" }).click();
  223 |     await buyer.waitForURL(/localhost:8082/, { timeout: 20000 });
  224 |     await buyer.getByRole("link", { name: "پرداخت موفق" }).click();
> 225 |     await buyer.waitForURL(/\/checkout\/result/, { timeout: 20000 });
      |                 ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  226 |     await learnerCtx.close();
  227 | 
  228 |     await page.goto("/admin/orders");
  229 |     await expect(page.getByRole("heading", { name: "سفارش‌ها" })).toBeVisible();
  230 | 
  231 |     const row = page.getByRole("row").filter({ hasText: "پرداخت‌شده" }).first();
  232 |     await expect(row).toBeVisible();
  233 |     await row.getByRole("button", { name: "بازگشت وجه" }).click();
  234 | 
  235 |     await page.locator("#refund-reason").fill("بازگشت وجه تست خودکار");
  236 |     await page.getByRole("button", { name: "ثبت بازگشت وجه" }).click();
  237 | 
  238 |     await expect(page.getByText("بازگشت‌خورده").first()).toBeVisible();
  239 | 
  240 |     expectNoClientErrors(diag);
  241 |   });
  242 | 
  243 |   test("the settings are saved", async ({ page, diag }) => {
  244 |     await page.goto("/admin/settings");
  245 | 
  246 |     const title = page.locator("#s-title");
  247 |     await expect(title).toBeVisible();
  248 |     const original = await title.inputValue();
  249 | 
  250 |     await title.fill(`${original} (E2E)`);
  251 |     await page.getByRole("button", { name: "ذخیره تنظیمات" }).click();
  252 |     await expect(page.getByText("تنظیمات ذخیره شد.")).toBeVisible();
  253 | 
  254 |     // restore
  255 |     await title.fill(original);
  256 |     await page.getByRole("button", { name: "ذخیره تنظیمات" }).click();
  257 |     await expect(page.getByText("تنظیمات ذخیره شد.")).toBeVisible();
  258 | 
  259 |     expectNoClientErrors(diag);
  260 |   });
  261 | 
  262 |   test("the audit log lists the admin mutations", async ({ page, diag }) => {
  263 |     await page.goto("/admin/audit-logs");
  264 | 
  265 |     await expect(page.getByRole("heading", { name: "گزارش رویدادها" })).toBeVisible();
  266 |     await expect(page.locator("table tbody tr").first()).toBeVisible();
  267 | 
  268 |     expectNoClientErrors(diag);
  269 |   });
  270 | 
  271 |   test("a learner cannot open the admin console", async ({ page, diag, browser }) => {
  272 |     const learnerCtx = await browser.newContext({ storageState: LEARNER_STATE });
  273 |     const learnerPage = await learnerCtx.newPage();
  274 | 
  275 |     await learnerPage.goto("/admin");
  276 |     await expect(learnerPage.getByText("این بخش فقط برای مدیران است.")).toBeVisible();
  277 | 
  278 |     await learnerCtx.close();
  279 |     expectNoClientErrors(diag);
  280 |   });
  281 | });
  282 | 
```