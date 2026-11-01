# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin console >> the overview shows the platform numbers
- Location: specs/admin.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('درآمد')
Expected: visible
Error: strict mode violation: getByText('درآمد') resolved to 2 elements:
    1) <p class="text-xs text-muted-foreground">درآمد</p> aka getByRole('paragraph').filter({ hasText: 'درآمد' })
    2) <th scope="col" class="px-5 py-3 text-start font-medium">درآمد</th> aka getByRole('columnheader', { name: 'درآمد' })

Call log:
  - Expect "toBeVisible" getByText('درآمد') with timeout 15000ms
  - waiting for getByText('درآمد')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - heading "نمای کلی" [level=1] [ref=e128]
          - paragraph [ref=e129]: داده‌های واقعی سیستم، بدون تخمین
        - generic [ref=e130]:
          - generic [ref=e131]:
            - paragraph [ref=e132]: درآمد
            - paragraph [ref=e133]: ۳٬۲۵۰٬۰۰۰ تومان
            - paragraph [ref=e134]: کل سفارش‌های پرداخت‌شده
          - generic [ref=e135]:
            - paragraph [ref=e136]: سفارش‌ها
            - paragraph [ref=e137]: ۱۳
            - paragraph [ref=e138]: ۵ پرداخت موفق
          - generic [ref=e139]:
            - paragraph [ref=e140]: نرخ موفقیت درگاه
            - paragraph [ref=e141]: ۸۳٪
            - paragraph [ref=e142]: از تلاش‌های پرداخت
          - generic [ref=e143]:
            - paragraph [ref=e144]: کاربران تازه
            - paragraph [ref=e145]: ۸
            - paragraph [ref=e146]: در بازهٔ گزارش
        - generic [ref=e147]:
          - generic [ref=e148]:
            - heading "پرفروش‌ترین دوره‌ها" [level=2] [ref=e149]
            - link "مدیریت دوره‌ها" [ref=e150] [cursor=pointer]:
              - /url: /admin/courses
          - table [ref=e151]:
            - rowgroup [ref=e152]:
              - row [ref=e153]:
                - columnheader "دوره" [ref=e154]
                - columnheader "دانشجو" [ref=e155]
                - columnheader "درآمد" [ref=e156]
            - rowgroup [ref=e157]:
              - row [ref=e158]:
                - cell [ref=e159]:
                  - link "آموزش Go از صفر" [ref=e160] [cursor=pointer]:
                    - /url: /courses/go-from-zero
                - cell "۳" [ref=e161]
                - cell "۱٬۲۵۰٬۰۰۰ تومان" [ref=e162]
              - row [ref=e163]:
                - cell [ref=e164]:
                  - link "دورهٔ آزمایشی تازه" [ref=e165] [cursor=pointer]:
                    - /url: /courses/%D8%AF%D9%88%D8%B1%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C-%D8%AA%D8%A7%D8%B2%D9%87
                - cell "۰" [ref=e166]
                - cell "۰ تومان" [ref=e167]
        - paragraph [ref=e168]: ساختار دوره‌ها (فصل‌ها، درس‌ها، رسانه‌ها) فعلاً از API مدیریت انجام می‌شود؛ رابط کامل آن در فاز بعد اضافه می‌شود.
  - button "Open Next.js Dev Tools" [ref=e174] [cursor=pointer]
  - alert [ref=e178]
```

# Test source

```ts
  1   | import {
  2   |   ADMIN_STATE,
  3   |   API_URL,
  4   |   createPublishedCourse,
  5   |   expect,
  6   |   expectNoClientErrors,
  7   |   FIXTURE_PNG,
  8   |   LEARNER_STATE,
  9   |   test,
  10  |   uniqueMobile,
  11  | } from "../lib/helpers";
  12  | 
  13  | test.describe("admin console", () => {
  14  |   test.use({ storageState: ADMIN_STATE });
  15  | 
  16  |   const stamp = Date.now();
  17  |   const courseTitle = `دورهٔ مدیریت تست ${stamp}`;
  18  |   const courseSlug = `e2e-admin-${stamp}`;
  19  |   const postTitle = `نوشتهٔ تست E2E ${stamp}`;
  20  |   const postSlug = `e2e-post-${stamp}`;
  21  | 
  22  |   test("the overview shows the platform numbers", async ({ page, diag }) => {
  23  |     await page.goto("/admin");
  24  | 
  25  |     await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
> 26  |     await expect(page.getByText("درآمد")).toBeVisible();
      |                                           ^ Error: expect(locator).toBeVisible() failed
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
  125 |     await page.getByRole("button", { name: "جست‌وجو" }).click();
  126 | 
```