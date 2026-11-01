# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin console >> an admin can block and unblock a user
- Location: specs/admin.spec.ts:167:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('row').filter({ hasText: '091317011749' })
Expected: 1
Received: 0
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" getByRole('row').filter({ hasText: '091317011749' }) with timeout 15000ms
  - waiting for getByRole('row').filter({ hasText: '091317011749' })
    34 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - paragraph [ref=e7]: مدیریت
        - paragraph [ref=e8]: گوLearn
      - generic [ref=e9]:
        - list [ref=e11]:
          - listitem [ref=e13]:
            - button "گزارش‌ها" [expanded] [ref=e14] [cursor=pointer]
            - list [ref=e19]:
              - listitem [ref=e20]:
                - link "نمای کلی" [ref=e21] [cursor=pointer]:
                  - /url: /admin
        - list [ref=e24]:
          - listitem [ref=e26]:
            - button "محتوا" [expanded] [ref=e27] [cursor=pointer]
            - list [ref=e32]:
              - listitem [ref=e33]:
                - link "دوره‌ها" [ref=e34] [cursor=pointer]:
                  - /url: /admin/courses
              - listitem [ref=e36]:
                - link "دسته‌بندی‌ها" [ref=e37] [cursor=pointer]:
                  - /url: /admin/categories
              - listitem [ref=e39]:
                - link "نوشته‌های وبلاگ" [ref=e40] [cursor=pointer]:
                  - /url: /admin/posts
              - listitem [ref=e42]:
                - link "رسانه‌ها" [ref=e43] [cursor=pointer]:
                  - /url: /admin/media
        - list [ref=e46]:
          - listitem [ref=e48]:
            - button "فروش" [expanded] [ref=e49] [cursor=pointer]
            - list [ref=e54]:
              - listitem [ref=e55]:
                - link "سفارش‌ها" [ref=e56] [cursor=pointer]:
                  - /url: /admin/orders
              - listitem [ref=e58]:
                - link "کدهای تخفیف" [ref=e59] [cursor=pointer]:
                  - /url: /admin/coupons
        - list [ref=e62]:
          - listitem [ref=e64]:
            - button "کاربران" [expanded] [ref=e65] [cursor=pointer]
            - list [ref=e70]:
              - listitem [ref=e71]:
                - link "کاربران" [ref=e72] [cursor=pointer]:
                  - /url: /admin/users
              - listitem [ref=e74]:
                - link "پیام‌های تماس" [ref=e75] [cursor=pointer]:
                  - /url: /admin/messages
        - list [ref=e78]:
          - listitem [ref=e80]:
            - button "سیستم" [expanded] [ref=e81] [cursor=pointer]
            - list [ref=e86]:
              - listitem [ref=e87]:
                - link "تنظیمات" [ref=e88] [cursor=pointer]:
                  - /url: /admin/settings
              - listitem [ref=e90]:
                - link "گزارش رویدادها" [ref=e91] [cursor=pointer]:
                  - /url: /admin/audit-logs
        - list [ref=e94]:
          - listitem [ref=e96]:
            - button "عمومی" [expanded] [ref=e97] [cursor=pointer]
            - list [ref=e102]:
              - listitem [ref=e103]:
                - link "خانهٔ سایت" [ref=e104] [cursor=pointer]:
                  - /url: /
      - generic [ref=e106]:
        - button "خروج از حساب" [ref=e107] [cursor=pointer]
        - paragraph [ref=e111]: استاد
        - paragraph [ref=e112]: "09121234567"
      - button "باز و بسته کردن نوار کناری" [ref=e113] [cursor=pointer]
    - main [ref=e114]:
      - generic [ref=e115]:
        - button "باز و بسته کردن نوار کناری" [ref=e116] [cursor=pointer]
        - separator [ref=e118]
        - generic [ref=e119]: مدیریت
        - button "تغییر تم روشن و تاریک" [ref=e121] [cursor=pointer]
      - generic [ref=e126]:
        - generic [ref=e127]:
          - heading "کاربران" [level=1] [ref=e128]
          - search [ref=e129]:
            - textbox "جست‌وجوی کاربر" [ref=e130]:
              - /placeholder: جست‌وجوی نام یا شماره
              - text: ۰۹۱۳۱۷۰۱۱۷۴۹
            - button "جست‌وجو" [active] [ref=e131] [cursor=pointer]
        - generic [ref=e132]:
          - paragraph [ref=e133]: کاربری با این عبارت پیدا نشد
          - paragraph [ref=e134]: عبارت جست‌وجو را ساده‌تر کن.
  - button "Open Next.js Dev Tools" [ref=e140] [cursor=pointer]
  - alert [ref=e144]
```

# Test source

```ts
  80  | 
  81  |     // the course is now on the public site
  82  |     await page.goto(`/courses/${courseSlug}`);
  83  |     await expect(page.getByRole("heading", { name: courseTitle })).toBeVisible();
  84  | 
  85  |     expectNoClientErrors(diag);
  86  |   });
  87  | 
  88  |   test("the cover image is uploaded through the media field", async ({ page, diag }) => {
  89  |     await page.goto("/admin/courses");
  90  |     await page.locator("#course-q").fill(courseTitle);
  91  |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  92  |     await page.getByRole("row").filter({ hasText: courseTitle }).getByRole("link", { name: "ویرایش" }).click();
  93  | 
  94  |     await page.getByRole("tab", { name: "رسانه و سئو" }).click();
  95  |     await page.getByLabel("بارگذاری تصویر کاور").setInputFiles(FIXTURE_PNG);
  96  | 
  97  |     await expect(page.getByText("فایل بارگذاری شد و در حال پردازش است.")).toBeVisible();
  98  | 
  99  |     // the asset is listed in the media library
  100 |     await page.goto("/admin/media");
  101 |     await expect(page.getByRole("heading", { name: "رسانه‌ها" })).toBeVisible();
  102 |     await expect(page.locator("table")).toBeVisible();
  103 | 
  104 |     expectNoClientErrors(diag);
  105 |   });
  106 | 
  107 |   test("a blog post is written, published, visible on the blog and deletable", async ({
  108 |     page,
  109 |     diag,
  110 |   }) => {
  111 |     await page.goto("/admin/posts/new");
  112 | 
  113 |     await page.locator("#p-title").fill(postTitle);
  114 |     await page.locator("#p-slug").fill(postSlug);
  115 |     await page.locator("#p-excerpt").fill("خلاصهٔ نوشتهٔ تست خودکار.");
  116 |     await page.getByRole("tab", { name: "بدنه" }).click();
  117 |     await page.locator('#p-body [contenteditable="true"]').click();
  118 |     await page.locator('#p-body [contenteditable="true"]').pressSequentially("متن نوشتهٔ تست خودکار.");
  119 |     await page.getByRole("button", { name: "ساخت نوشته" }).click();
  120 | 
  121 |     await expect(page.getByText("ذخیره شد")).toBeVisible();
  122 | 
  123 |     await page.goto("/admin/posts");
  124 |     await page.locator("#post-q").fill(postTitle);
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
> 180 |     await expect(row).toHaveCount(1);
      |                       ^ Error: expect(locator).toHaveCount(expected) failed
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
  225 |     await buyer.waitForURL(/\/checkout\/result/, { timeout: 20000 });
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
```