# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin console >> a blog post is written, published, visible on the blog and deletable
- Location: specs/admin.spec.ts:107:7

# Error details

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'جست‌وجو' })

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - generic [ref=f1e5]:
      - generic [ref=f1e6]:
        - paragraph [ref=f1e7]: مدیریت
        - paragraph [ref=f1e8]: گوLearn
      - generic [ref=f1e9]:
        - list [ref=f1e11]:
          - listitem [ref=f1e13]:
            - button "گزارش‌ها" [expanded] [ref=f1e14] [cursor=pointer]
            - list [ref=f1e19]:
              - listitem [ref=f1e20]:
                - link "نمای کلی" [ref=f1e21] [cursor=pointer]:
                  - /url: /admin
        - list [ref=f1e24]:
          - listitem [ref=f1e26]:
            - button "محتوا" [expanded] [ref=f1e27] [cursor=pointer]
            - list [ref=f1e32]:
              - listitem [ref=f1e33]:
                - link "دوره‌ها" [ref=f1e34] [cursor=pointer]:
                  - /url: /admin/courses
              - listitem [ref=f1e36]:
                - link "دسته‌بندی‌ها" [ref=f1e37] [cursor=pointer]:
                  - /url: /admin/categories
              - listitem [ref=f1e39]:
                - link "نوشته‌های وبلاگ" [ref=f1e40] [cursor=pointer]:
                  - /url: /admin/posts
              - listitem [ref=f1e42]:
                - link "رسانه‌ها" [ref=f1e43] [cursor=pointer]:
                  - /url: /admin/media
        - list [ref=f1e46]:
          - listitem [ref=f1e48]:
            - button "فروش" [expanded] [ref=f1e49] [cursor=pointer]
            - list [ref=f1e54]:
              - listitem [ref=f1e55]:
                - link "سفارش‌ها" [ref=f1e56] [cursor=pointer]:
                  - /url: /admin/orders
              - listitem [ref=f1e58]:
                - link "کدهای تخفیف" [ref=f1e59] [cursor=pointer]:
                  - /url: /admin/coupons
        - list [ref=f1e62]:
          - listitem [ref=f1e64]:
            - button "کاربران" [expanded] [ref=f1e65] [cursor=pointer]
            - list [ref=f1e70]:
              - listitem [ref=f1e71]:
                - link "کاربران" [ref=f1e72] [cursor=pointer]:
                  - /url: /admin/users
              - listitem [ref=f1e74]:
                - link "پیام‌های تماس" [ref=f1e75] [cursor=pointer]:
                  - /url: /admin/messages
        - list [ref=f1e78]:
          - listitem [ref=f1e80]:
            - button "سیستم" [expanded] [ref=f1e81] [cursor=pointer]
            - list [ref=f1e86]:
              - listitem [ref=f1e87]:
                - link "تنظیمات" [ref=f1e88] [cursor=pointer]:
                  - /url: /admin/settings
              - listitem [ref=f1e90]:
                - link "گزارش رویدادها" [ref=f1e91] [cursor=pointer]:
                  - /url: /admin/audit-logs
        - list [ref=f1e94]:
          - listitem [ref=f1e96]:
            - button "عمومی" [expanded] [ref=f1e97] [cursor=pointer]
            - list [ref=f1e102]:
              - listitem [ref=f1e103]:
                - link "خانهٔ سایت" [ref=f1e104] [cursor=pointer]:
                  - /url: /
      - generic [ref=f1e106]:
        - button "خروج از حساب" [ref=f1e107] [cursor=pointer]
        - paragraph [ref=f1e111]: استاد
        - paragraph [ref=f1e112]: "09121234567"
      - button "باز و بسته کردن نوار کناری" [ref=f1e113] [cursor=pointer]
    - main [ref=f1e114]:
      - generic [ref=f1e115]:
        - button "باز و بسته کردن نوار کناری" [ref=f1e116] [cursor=pointer]
        - separator [ref=f1e118]
        - generic [ref=f1e119]: مدیریت
        - button "تغییر تم روشن و تاریک" [ref=f1e121] [cursor=pointer]
      - generic [ref=f1e126]:
        - generic [ref=f1e127]:
          - generic [ref=f1e128]:
            - heading "نوشته‌های وبلاگ" [level=1] [ref=f1e129]
            - paragraph [ref=f1e130]: ۲ نوشته ثبت شده است.
          - link "نوشتهٔ تازه" [ref=f1e131] [cursor=pointer]:
            - /url: /admin/posts/new
        - generic [ref=f1e132]:
          - generic [ref=f1e133]:
            - tablist [ref=f1e135]:
              - tab "همه" [selected] [ref=f1e136] [cursor=pointer]
              - tab "پیش‌نویس" [ref=f1e137] [cursor=pointer]
              - tab "منتشرشده" [ref=f1e138] [cursor=pointer]
            - search [ref=f1e139]:
              - generic [ref=f1e140]:
                - generic [ref=f1e141] [cursor=pointer]: جست‌وجو
                - textbox "جست‌وجو" [active] [ref=f1e142]:
                  - /placeholder: عنوان یا نامک نوشته
                  - text: نوشتهٔ تست E۲E ۱۷۹۳۵۷۶۱۵۳۹۰۰
              - generic [ref=f1e143]:
                - generic [ref=f1e144] [cursor=pointer]: دسته‌بندی
                - combobox "دسته‌بندی" [ref=f1e145] [cursor=pointer]:
                  - option "همهٔ دسته‌ها" [selected]
              - generic [ref=f1e146]:
                - generic [ref=f1e147] [cursor=pointer]: برچسب
                - combobox "برچسب" [ref=f1e148] [cursor=pointer]:
                  - option "همهٔ برچسب‌ها" [selected]
                  - option "وب"
                  - option "گو"
              - generic [ref=f1e149]:
                - generic [ref=f1e150] [cursor=pointer]: ترتیب
                - combobox "ترتیب" [ref=f1e151] [cursor=pointer]:
                  - option "تازه‌ترین" [selected]
                  - option "قدیمی‌ترین"
                  - option "آخرین انتشار"
                  - option "عنوان"
              - button "اعمال" [ref=f1e152] [cursor=pointer]
          - table [ref=f1e154]:
            - rowgroup [ref=f1e155]:
              - row [ref=f1e156]:
                - columnheader "نوشته" [ref=f1e157]
                - columnheader "تاریخ" [ref=f1e158]
                - columnheader "وضعیت" [ref=f1e159]
                - columnheader "کنش‌ها" [ref=f1e160]
            - rowgroup [ref=f1e161]:
              - row [ref=f1e162]:
                - cell [ref=f1e163]:
                  - link "نوشتهٔ تست E2E 1793576153900" [ref=f1e164] [cursor=pointer]:
                    - /url: /blog/e2e-post-1793576153900
                  - paragraph [ref=f1e165]: /blog/e2e-post-1793576153900
                - cell [ref=f1e166]
                - cell "پیش‌نویس" [ref=f1e167]
                - cell [ref=f1e169]:
                  - generic [ref=f1e170]:
                    - link "ویرایش" [ref=f1e171] [cursor=pointer]:
                      - /url: /admin/posts/01a19978-41a4-73db-ab9f-e525f4e30987
                    - button "انتشار" [ref=f1e172] [cursor=pointer]
                    - button "حذف" [ref=f1e173] [cursor=pointer]
              - row [ref=f1e174]:
                - cell [ref=f1e175]:
                  - link "نوشتهٔ آزمایشی" [ref=f1e176] [cursor=pointer]:
                    - /url: /blog/%D9%86%D9%88%D8%B4%D8%AA%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C
                  - paragraph [ref=f1e177]: /blog/نوشته-آزمایشی
                - cell "۱۱ آبان ۱۴۰۵" [ref=f1e178]
                - cell "پیش‌نویس" [ref=f1e179]
                - cell [ref=f1e181]:
                  - generic [ref=f1e182]:
                    - link "ویرایش" [ref=f1e183] [cursor=pointer]:
                      - /url: /admin/posts/01a19953-deb1-75b0-9708-a9b743c71d81
                    - button "انتشار" [ref=f1e184] [cursor=pointer]
                    - button "حذف" [ref=f1e185] [cursor=pointer]
          - generic [ref=f1e186]:
            - generic [ref=f1e187]: صفحهٔ ۱ از ۱
            - generic [ref=f1e188]:
              - button "قبلی" [disabled]
              - button "بعدی" [disabled]
  - button "Open Next.js Dev Tools" [ref=f1e194] [cursor=pointer]
  - alert [ref=f1e198]
```

# Test source

```ts
  25  |     await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
  26  |     await expect(page.getByText("درآمد")).toBeVisible();
  27  |     await expect(page.getByText("سفارش‌ها")).toBeVisible();
  28  |     await expect(page.getByText("کاربران تازه")).toBeVisible();
  29  | 
  30  |     expectNoClientErrors(diag);
  31  |   });
  32  | 
  33  |   test("a course is created, gets a curriculum, is published and shows up on the site", async ({
  34  |     page,
  35  |     diag,
  36  |   }) => {
  37  |     await page.goto("/admin/courses/new");
  38  | 
  39  |     await page.locator("#c-title").fill(courseTitle);
  40  |     await page.locator("#c-slug").fill(courseSlug);
  41  |     await page.locator("#c-level").selectOption("beginner");
  42  |     await page.locator("#c-price").fill("25000");
  43  |     await page.locator("#c-summary").fill("خلاصهٔ دورهٔ ساخته‌شده توسط تست خودکار.");
  44  |     await page.getByRole("button", { name: "ساخت دوره" }).click();
  45  | 
  46  |     await expect(page.getByText("ذخیره شد")).toBeVisible();
  47  | 
  48  |     // the course is listed
  49  |     await page.goto("/admin/courses");
  50  |     await expect(page.getByLabel("جست‌وجوی دوره")).toBeVisible();
  51  |     await page.locator("#course-q").fill(courseTitle);
  52  |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  53  | 
  54  |     const row = page.getByRole("row").filter({ hasText: courseTitle });
  55  |     await expect(row).toHaveCount(1);
  56  | 
  57  |     // curriculum: one section with one ready lesson
  58  |     await row.getByRole("link", { name: "ویرایش" }).click();
  59  |     await expect(page.getByRole("heading", { name: "ویرایش دوره" })).toBeVisible();
  60  | 
  61  |     await page.getByRole("tab", { name: "سرفصل" }).click();
  62  |     await page.locator("#new-section").fill("بخش تست مدیریت");
  63  |     await page.getByRole("button", { name: "افزودن بخش" }).click();
  64  |     await expect(page.getByText("بخش تست مدیریت")).toBeVisible();
  65  | 
  66  |     await page.getByRole("button", { name: "افزودن درس" }).click();
  67  |     await page.locator("#lesson-title").fill("درس تست مدیریت");
  68  |     await page.locator("#lesson-duration").fill("5");
  69  |     await page.locator("#lesson-status").selectOption("ready");
  70  |     await page.getByRole("button", { name: "افزودن درس", exact: true }).click();
  71  |     await expect(page.getByText("درس تست مدیریت")).toBeVisible();
  72  | 
  73  |     // publish from the list
  74  |     await page.goto("/admin/courses");
  75  |     await page.locator("#course-q").fill(courseTitle);
  76  |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  77  |     const publishRow = page.getByRole("row").filter({ hasText: courseTitle });
  78  |     await publishRow.getByRole("button", { name: "انتشار" }).click();
  79  |     await expect(publishRow.getByText("منتشرشده")).toBeVisible();
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
> 125 |     await page.getByRole("button", { name: "جست‌وجو" }).click();
      |                                                         ^ TimeoutError: locator.click: Timeout 20000ms exceeded.
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
  225 |     await buyer.waitForURL(/\/checkout\/result/, { timeout: 20000 });
```