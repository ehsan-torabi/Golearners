# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin console >> the cover image is uploaded through the media field
- Location: specs/admin.spec.ts:88:7

# Error details

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'جست‌وجو' })

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
          - generic [ref=e128]:
            - heading "دوره‌ها" [level=1] [ref=e129]
            - paragraph [ref=e130]: ۳ دوره ثبت شده است.
          - link "دورهٔ تازه" [ref=e131] [cursor=pointer]:
            - /url: /admin/courses/new
        - generic [ref=e132]:
          - generic [ref=e133]:
            - tablist [ref=e135]:
              - tab "همه" [selected] [ref=e136] [cursor=pointer]
              - tab "پیش‌نویس" [ref=e137] [cursor=pointer]
              - tab "منتشرشده" [ref=e138] [cursor=pointer]
              - tab "بایگانی" [ref=e139] [cursor=pointer]
            - search [ref=e140]:
              - generic [ref=e141]:
                - generic [ref=e142] [cursor=pointer]: جست‌وجو
                - textbox "جست‌وجو" [active] [ref=e143]:
                  - /placeholder: عنوان یا نامک دوره
                  - text: دورهٔ مدیریت تست ۱۷۹۳۵۷۶۱۳۰۱۷۰
              - generic [ref=e144]:
                - generic [ref=e145] [cursor=pointer]: سطح
                - combobox "سطح" [ref=e146] [cursor=pointer]:
                  - option "همهٔ سطوح" [selected]
                  - option "مقدماتی"
                  - option "متوسط"
                  - option "پیشرفته"
              - generic [ref=e147]:
                - generic [ref=e148] [cursor=pointer]: دسته‌بندی
                - combobox "دسته‌بندی" [ref=e149] [cursor=pointer]:
                  - option "همهٔ دسته‌ها" [selected]
              - generic [ref=e150]:
                - generic [ref=e151] [cursor=pointer]: ترتیب
                - combobox "ترتیب" [ref=e152] [cursor=pointer]:
                  - option "تازه‌ترین" [selected]
                  - option "قدیمی‌ترین"
                  - option "عنوان"
                  - option "ارزان‌ترین"
                  - option "گران‌ترین"
                  - option "ویژه و پرطرفدار"
              - generic [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: قیمت از (تومان)
                - textbox "قیمت از (تومان)" [ref=e155]
              - generic [ref=e156]:
                - generic [ref=e157] [cursor=pointer]: تا (تومان)
                - textbox "تا (تومان)" [ref=e158]
              - generic [ref=e159]:
                - checkbox "فقط ویژه‌ها" [ref=e160]
                - checkbox [aria-hidden] [ref=e161] [cursor=pointer]
                - generic [ref=e162] [cursor=pointer]: فقط ویژه‌ها
              - button "اعمال" [ref=e163] [cursor=pointer]
          - table [ref=e165]:
            - rowgroup [ref=e166]:
              - row [ref=e167]:
                - columnheader "دوره" [ref=e168]
                - columnheader "سطح" [ref=e169]
                - columnheader "قیمت" [ref=e170]
                - columnheader "وضعیت" [ref=e171]
                - columnheader "کنش‌ها" [ref=e172]
            - rowgroup [ref=e173]:
              - row [ref=e174]:
                - cell [ref=e175]:
                  - link "دورهٔ آزمایشی تازه" [ref=e176] [cursor=pointer]:
                    - /url: /courses/%D8%AF%D9%88%D8%B1%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C-%D8%AA%D8%A7%D8%B2%D9%87
                  - paragraph [ref=e177]: /courses/دوره-آزمایشی-تازه
                - cell "متوسط" [ref=e178]
                - cell "۱۵٬۰۰۰ تومان" [ref=e179]
                - cell "منتشرشده" [ref=e180]
                - cell [ref=e182]:
                  - generic [ref=e183]:
                    - link "ویرایش" [ref=e184] [cursor=pointer]:
                      - /url: /admin/courses/01a19953-9668-7813-9667-75d49e5bb112
                    - button "لغو انتشار" [ref=e185] [cursor=pointer]
                    - button "حذف" [ref=e186] [cursor=pointer]
              - row [ref=e187]:
                - cell [ref=e188]:
                  - link "آموزش Go از صفر" [ref=e189] [cursor=pointer]:
                    - /url: /courses/go-from-zero
                  - paragraph [ref=e190]: /courses/go-from-zero
                - cell "مقدماتی" [ref=e191]
                - cell "۲۵۰٬۰۰۰ تومان" [ref=e192]
                - cell "منتشرشده" [ref=e193]
                - cell [ref=e195]:
                  - generic [ref=e196]:
                    - link "ویرایش" [ref=e197] [cursor=pointer]:
                      - /url: /admin/courses/01a19010-4443-7b22-a3af-205d6f580ee6
                    - button "لغو انتشار" [ref=e198] [cursor=pointer]
                    - button "حذف" [ref=e199] [cursor=pointer]
              - row [ref=e200]:
                - cell [ref=e201]:
                  - link "دورهٔ مدیریت تست 1793576104459" [ref=e202] [cursor=pointer]:
                    - /url: /courses/e2e-admin-1793576104459
                  - paragraph [ref=e203]: /courses/e2e-admin-1793576104459
                - cell "مقدماتی" [ref=e204]
                - cell "۲۵٬۰۰۰ تومان" [ref=e205]
                - cell "پیش‌نویس" [ref=e206]
                - cell [ref=e208]:
                  - generic [ref=e209]:
                    - link "ویرایش" [ref=e210] [cursor=pointer]:
                      - /url: /admin/courses/01a19977-8db7-7333-8ce9-1a9d459df7cc
                    - button "انتشار" [ref=e211] [cursor=pointer]
                    - button "حذف" [ref=e212] [cursor=pointer]
          - generic [ref=e213]:
            - generic [ref=e214]: صفحهٔ ۱ از ۱
            - generic [ref=e215]:
              - button "قبلی" [disabled]
              - button "بعدی" [disabled]
  - button "Open Next.js Dev Tools" [ref=e221] [cursor=pointer]
  - alert [ref=e225]
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
> 91  |     await page.getByRole("button", { name: "جست‌وجو" }).click();
      |                                                         ^ TimeoutError: locator.click: Timeout 20000ms exceeded.
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
```