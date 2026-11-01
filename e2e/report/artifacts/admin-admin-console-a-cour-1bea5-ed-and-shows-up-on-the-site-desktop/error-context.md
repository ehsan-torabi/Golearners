# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin console >> a course is created, gets a curriculum, is published and shows up on the site
- Location: specs/admin.spec.ts:33:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('جست‌وجوی دوره')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByLabel('جست‌وجوی دوره') with timeout 15000ms
  - waiting for getByLabel('جست‌وجوی دوره')

```

```yaml
- paragraph: مدیریت
- paragraph: گوLearn
- list:
  - listitem:
    - button "گزارش‌ها" [expanded]:
      - text: گزارش‌ها
      - img
    - list:
      - listitem:
        - link "نمای کلی":
          - /url: /admin
- list:
  - listitem:
    - button "محتوا" [expanded]:
      - text: محتوا
      - img
    - list:
      - listitem:
        - link "دوره‌ها":
          - /url: /admin/courses
      - listitem:
        - link "دسته‌بندی‌ها":
          - /url: /admin/categories
      - listitem:
        - link "نوشته‌های وبلاگ":
          - /url: /admin/posts
      - listitem:
        - link "رسانه‌ها":
          - /url: /admin/media
- list:
  - listitem:
    - button "فروش" [expanded]:
      - text: فروش
      - img
    - list:
      - listitem:
        - link "سفارش‌ها":
          - /url: /admin/orders
      - listitem:
        - link "کدهای تخفیف":
          - /url: /admin/coupons
- list:
  - listitem:
    - button "کاربران" [expanded]:
      - text: کاربران
      - img
    - list:
      - listitem:
        - link "کاربران":
          - /url: /admin/users
      - listitem:
        - link "پیام‌های تماس":
          - /url: /admin/messages
- list:
  - listitem:
    - button "سیستم" [expanded]:
      - text: سیستم
      - img
    - list:
      - listitem:
        - link "تنظیمات":
          - /url: /admin/settings
      - listitem:
        - link "گزارش رویدادها":
          - /url: /admin/audit-logs
- list:
  - listitem:
    - button "عمومی" [expanded]:
      - text: عمومی
      - img
    - list:
      - listitem:
        - link "خانهٔ سایت":
          - /url: /
- button "خروج از حساب"
- paragraph: استاد
- paragraph: "09121234567"
- button "باز و بسته کردن نوار کناری"
- main:
  - button "باز و بسته کردن نوار کناری":
    - img
    - text: باز و بسته کردن نوار کناری
  - separator
  - text: مدیریت
  - button "تغییر تم روشن و تاریک"
  - heading "دوره‌ها" [level=1]
  - paragraph: ۳ دوره ثبت شده است.
  - link "دورهٔ تازه":
    - /url: /admin/courses/new
  - tablist:
    - tab "همه" [selected]
    - tab "پیش‌نویس"
    - tab "منتشرشده"
    - tab "بایگانی"
  - search:
    - text: جست‌وجو
    - textbox "جست‌وجو":
      - /placeholder: عنوان یا نامک دوره
    - text: سطح
    - combobox "سطح":
      - option "همهٔ سطوح" [selected]
      - option "مقدماتی"
      - option "متوسط"
      - option "پیشرفته"
    - text: دسته‌بندی
    - combobox "دسته‌بندی":
      - option "همهٔ دسته‌ها" [selected]
    - text: ترتیب
    - combobox "ترتیب":
      - option "تازه‌ترین" [selected]
      - option "قدیمی‌ترین"
      - option "عنوان"
      - option "ارزان‌ترین"
      - option "گران‌ترین"
      - option "ویژه و پرطرفدار"
    - text: قیمت از (تومان)
    - textbox "قیمت از (تومان)"
    - text: تا (تومان)
    - textbox "تا (تومان)"
    - checkbox "فقط ویژه‌ها"
    - text: فقط ویژه‌ها
    - button "اعمال"
  - table:
    - rowgroup:
      - row "دوره سطح قیمت وضعیت کنش‌ها":
        - columnheader "دوره"
        - columnheader "سطح"
        - columnheader "قیمت"
        - columnheader "وضعیت"
        - columnheader "کنش‌ها"
    - rowgroup:
      - row "دورهٔ آزمایشی تازه /courses/دوره-آزمایشی-تازه متوسط ۱۵٬۰۰۰ تومان منتشرشده ویرایش لغو انتشار حذف":
        - cell "دورهٔ آزمایشی تازه /courses/دوره-آزمایشی-تازه":
          - link "دورهٔ آزمایشی تازه":
            - /url: /courses/%D8%AF%D9%88%D8%B1%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C-%D8%AA%D8%A7%D8%B2%D9%87
          - paragraph: /courses/دوره-آزمایشی-تازه
        - cell "متوسط"
        - cell "۱۵٬۰۰۰ تومان"
        - cell "منتشرشده"
        - cell "ویرایش لغو انتشار حذف":
          - link "ویرایش":
            - /url: /admin/courses/01a19953-9668-7813-9667-75d49e5bb112
          - button "لغو انتشار"
          - button "حذف"
      - row "آموزش Go از صفر /courses/go-from-zero مقدماتی ۲۵۰٬۰۰۰ تومان منتشرشده ویرایش لغو انتشار حذف":
        - cell "آموزش Go از صفر /courses/go-from-zero":
          - link "آموزش Go از صفر":
            - /url: /courses/go-from-zero
          - paragraph: /courses/go-from-zero
        - cell "مقدماتی"
        - cell "۲۵۰٬۰۰۰ تومان"
        - cell "منتشرشده"
        - cell "ویرایش لغو انتشار حذف":
          - link "ویرایش":
            - /url: /admin/courses/01a19010-4443-7b22-a3af-205d6f580ee6
          - button "لغو انتشار"
          - button "حذف"
      - row "دورهٔ مدیریت تست 1793576104459 /courses/e2e-admin-1793576104459 مقدماتی ۲۵٬۰۰۰ تومان پیش‌نویس ویرایش انتشار حذف":
        - cell "دورهٔ مدیریت تست 1793576104459 /courses/e2e-admin-1793576104459":
          - link "دورهٔ مدیریت تست 1793576104459":
            - /url: /courses/e2e-admin-1793576104459
          - paragraph: /courses/e2e-admin-1793576104459
        - cell "مقدماتی"
        - cell "۲۵٬۰۰۰ تومان"
        - cell "پیش‌نویس"
        - cell "ویرایش انتشار حذف":
          - link "ویرایش":
            - /url: /admin/courses/01a19977-8db7-7333-8ce9-1a9d459df7cc
          - button "انتشار"
          - button "حذف"
  - text: صفحهٔ ۱ از ۱
  - button "قبلی" [disabled]
  - button "بعدی" [disabled]
- alert
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
> 50  |     await expect(page.getByLabel("جست‌وجوی دوره")).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
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
```