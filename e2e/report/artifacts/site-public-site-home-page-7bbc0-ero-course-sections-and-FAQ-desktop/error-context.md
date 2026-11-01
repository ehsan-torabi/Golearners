# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site.spec.ts >> public site >> home page renders hero, course sections and FAQ
- Location: specs/site.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'سوال‌های پرتکرار' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'سوال‌های پرتکرار' }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'سوال‌های پرتکرار' })

```

```yaml
- banner:
  - link "گوLearn":
    - /url: /
  - navigation "ناوبری اصلی":
    - link "دوره‌ها":
      - /url: /courses
    - link "وبلاگ":
      - /url: /blog
    - link "درباره مدرس":
      - /url: /instructor
    - link "تماس":
      - /url: /contact
  - button "تغییر تم روشن و تاریک"
  - link "ورود":
    - /url: /login
- main:
  - region "برنامه‌نویسی را درست یاد بگیر":
    - heading "برنامه‌نویسی را درست یاد بگیر" [level=1]
    - paragraph: دوره‌های ویدیویی فارسی، پروژه‌محور و با دسترسی مادام‌العمر. ویدیوها را یک بار بخر، برای همیشه داشته باش.
    - link "دیدن دوره‌ها":
      - /url: /courses
    - link "آشنایی با مدرس":
      - /url: /instructor
  - region "دوره‌های پربازدید":
    - heading "دوره‌های پربازدید" [level=2]
    - link "همه دوره‌ها":
      - /url: /courses
    - link "متوسط دورهٔ آزمایشی تازه خلاصهٔ آزمایشی ۱۵٬۰۰۰ تومان ۲۰٬۰۰۰ تومان":
      - /url: /courses/%D8%AF%D9%88%D8%B1%D9%87-%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DB%8C-%D8%AA%D8%A7%D8%B2%D9%87
      - text: متوسط
      - heading "دورهٔ آزمایشی تازه" [level=3]
      - paragraph: خلاصهٔ آزمایشی
      - text: ۱۵٬۰۰۰ تومان ۲۰٬۰۰۰ تومان
    - link "دورهٔ سفارش تست 1793576467314 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان":
      - /url: /courses/e2e-mvyh4lat
      - heading "دورهٔ سفارش تست 1793576467314" [level=3]
      - text: مقدماتی
      - paragraph: دورهٔ ساخته‌شده توسط تست خودکار E2E.
      - text: ۲۰٬۰۰۰ تومان
    - link "دورهٔ پخش تست 1793576467314 مقدماتی دورهٔ تست پخش ۳۰٬۰۰۰ تومان":
      - /url: /courses/e2e-play-1793576467314
      - heading "دورهٔ پخش تست 1793576467314" [level=3]
      - text: مقدماتی
      - paragraph: دورهٔ تست پخش
      - text: ۳۰٬۰۰۰ تومان
    - link "دورهٔ سفارش تست 1793576426056 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان":
      - /url: /courses/e2e-mvyh3qln
      - heading "دورهٔ سفارش تست 1793576426056" [level=3]
      - text: مقدماتی
      - paragraph: دورهٔ ساخته‌شده توسط تست خودکار E2E.
      - text: ۲۰٬۰۰۰ تومان
    - link "دورهٔ پخش تست 1793576426056 مقدماتی دورهٔ تست پخش ۳۰٬۰۰۰ تومان":
      - /url: /courses/e2e-play-1793576426056
      - heading "دورهٔ پخش تست 1793576426056" [level=3]
      - text: مقدماتی
      - paragraph: دورهٔ تست پخش
      - text: ۳۰٬۰۰۰ تومان
    - link "دورهٔ تخفیف تست 1793576421924 مقدماتی دورهٔ ساخته‌شده توسط تست خودکار E2E. ۲۰٬۰۰۰ تومان":
      - /url: /courses/e2e-mvyh3cbr
      - heading "دورهٔ تخفیف تست 1793576421924" [level=3]
      - text: مقدماتی
      - paragraph: دورهٔ ساخته‌شده توسط تست خودکار E2E.
      - text: ۲۰٬۰۰۰ تومان
  - region "مسیر یادگیری":
    - heading "مسیر یادگیری" [level=2]
    - list:
      - listitem:
        - heading "انتخاب دوره" [level=3]
        - paragraph: بر اساس سطح و موضوع، دورهٔ مناسب خودت را پیدا کن.
      - listitem:
        - heading "خرید و دسترسی همیشگی" [level=3]
        - paragraph: پرداخت با درگاه‌های بانکی ایران؛ ویدیوها بعد از خرید همیشه در دسترس‌اند.
      - listitem:
        - heading "یادگیری با پشتیبانی" [level=3]
        - paragraph: اگر جایی گیر کردی، از صفحهٔ تماس برای مدرس پیام بگذار.
  - region "شروع یادگیری":
    - heading "دوره‌ات را انتخاب کن" [level=2]
    - paragraph: از اولین درس تا آخرین پروژه، همه چیز فارسی و قدم‌به‌قدم.
    - link "انتخاب دوره":
      - /url: /courses
- contentinfo:
  - paragraph: گوLearn
  - paragraph: دوره‌های ویدیویی برنامه‌نویسی به فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.
  - navigation "ناوبری پابرگ":
    - link "دوره‌ها":
      - /url: /courses
    - link "وبلاگ":
      - /url: /blog
    - link "درباره مدرس":
      - /url: /instructor
    - link "تماس":
      - /url: /contact
    - link "support@golearn.ir":
      - /url: mailto:support@golearn.ir
  - text: گوLearn ،۱۴۰۵. همه محتوا متعلق به این رسانه است.
- alert
```

# Test source

```ts
  1   | import { expect, expectNoClientErrors, test } from "../lib/helpers";
  2   | 
  3   | test.describe("public site", () => {
  4   |   test("home page renders hero, course sections and FAQ", async ({ page, diag }) => {
  5   |     await page.goto("/");
  6   | 
  7   |     await expect(page.getByRole("heading", { name: "برنامه‌نویسی را درست یاد بگیر" })).toBeVisible();
  8   |     await expect(page.getByRole("link", { name: "دیدن دوره‌ها" })).toBeVisible();
  9   |     await expect(page.getByRole("heading", { name: "دوره‌های پربازدید" })).toBeVisible();
  10  |     await expect(page.getByRole("heading", { name: "مسیر یادگیری" })).toBeVisible();
> 11  |     await expect(page.getByRole("heading", { name: "سوال‌های پرتکرار" })).toBeVisible();
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  12  |     await expect(page.getByRole("heading", { name: "دوره‌ات را انتخاب کن" })).toBeVisible();
  13  | 
  14  |     expectNoClientErrors(diag);
  15  |   });
  16  | 
  17  |   test("courses list shows cards that lead to a detail page", async ({ page, diag }) => {
  18  |     await page.goto("/courses");
  19  | 
  20  |     await expect(page.getByRole("heading", { name: "دوره‌ها", level: 1 })).toBeVisible();
  21  |     const card = page.locator('a[href^="/courses/"]').first();
  22  |     await expect(card).toBeVisible();
  23  |     await card.click();
  24  |     await expect(page).toHaveURL(/\/courses\/[^/]+$/);
  25  |     await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  26  | 
  27  |     expectNoClientErrors(diag);
  28  |   });
  29  | 
  30  |   test("course search finds the known course", async ({ page, diag }) => {
  31  |     await page.goto("/courses?q=Go");
  32  |     await page.getByRole("button", { name: "اعمال فیلتر" }).click();
  33  |     await page.waitForURL(/q=Go/);
  34  | 
  35  |     await expect(
  36  |       page.getByRole("link", { name: /آموزش Go از صفر/ }).first(),
  37  |     ).toBeVisible();
  38  | 
  39  |     expectNoClientErrors(diag);
  40  |   });
  41  | 
  42  |   test("course detail shows curriculum and a guest purchase CTA", async ({ page, diag }) => {
  43  |     await page.goto("/courses/go-from-zero");
  44  | 
  45  |     await expect(page.getByRole("heading", { name: "آموزش Go از صفر" })).toBeVisible();
  46  |     await expect(page.getByRole("heading", { name: "سرفصل‌ها" })).toBeVisible();
  47  |     // a guest never sees the checkout button — only the login prompt
  48  |     await expect(page.getByRole("link", { name: "ورود برای خرید" })).toBeVisible();
  49  | 
  50  |     expectNoClientErrors(diag);
  51  |   });
  52  | 
  53  |   test("unknown course slug renders the not-found page", async ({ page, diag }) => {
  54  |     const response = await page.goto("/courses/does-not-exist-e2e");
  55  |     expect(response?.status()).toBe(404);
  56  |     expectNoClientErrors(diag);
  57  |   });
  58  | 
  59  |   test("blog list renders posts or the empty state", async ({ page, diag }) => {
  60  |     await page.goto("/blog");
  61  | 
  62  |     await expect(page.getByRole("heading", { name: "وبلاگ", level: 1 })).toBeVisible();
  63  |     const empty = page.getByText("هنوز مقاله‌ای منتشر نشده است");
  64  |     const post = page.locator('a[href^="/blog/"]').first();
  65  |     await expect(empty.or(post)).toBeVisible();
  66  | 
  67  |     if (await post.isVisible()) {
  68  |       await post.click();
  69  |       await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  70  |     }
  71  | 
  72  |     expectNoClientErrors(diag);
  73  |   });
  74  | 
  75  |   test("instructor page renders the profile or its empty state", async ({ page, diag }) => {
  76  |     await page.goto("/instructor");
  77  | 
  78  |     await expect(page.getByRole("heading", { name: "درباره مدرس" })).toBeVisible();
  79  |     const empty = page.getByText("اطلاعات مدرس هنوز تکمیل نشده است");
  80  |     const headline = page.locator("main p").first();
  81  |     await expect(empty.or(headline)).toBeVisible();
  82  | 
  83  |     expectNoClientErrors(diag);
  84  |   });
  85  | 
  86  |   test("contact form stores a message and confirms", async ({ page, diag }) => {
  87  |     await page.goto("/contact");
  88  | 
  89  |     await page.getByLabel("نام").fill("کاربر تست E2E");
  90  |     await page.getByLabel("موبایل یا ایمیل").fill("09121110099");
  91  |     await page.getByLabel("پیام").fill("این یک پیام تست خودکار از تست E2E است.");
  92  |     await page.getByRole("button", { name: "ارسال پیام" }).click();
  93  | 
  94  |     await expect(page.getByText("پیام شما ثبت شد؛ در اولین فرصت پاسخ می‌دهیم.")).toBeVisible();
  95  | 
  96  |     expectNoClientErrors(diag);
  97  |   });
  98  | 
  99  |   test("contact form rejects a too short message", async ({ page, diag }) => {
  100 |     await page.goto("/contact");
  101 | 
  102 |     await page.getByLabel("نام").fill("کاربر تست E2E");
  103 |     await page.getByLabel("موبایل یا ایمیل").fill("09121110098");
  104 |     await page.getByLabel("پیام").fill("کوتاه");
  105 |     await page.getByRole("button", { name: "ارسال پیام" }).click();
  106 | 
  107 |     await expect(page.getByText("پیام شما ثبت شد؛ در اولین فرصت پاسخ می‌دهیم.")).toBeHidden();
  108 |     expectNoClientErrors(diag);
  109 |   });
  110 | 
  111 |   test("navbar reaches every public section", async ({ page, diag }) => {
```