# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site.spec.ts >> public site >> theme toggle switches the colour scheme
- Location: specs/site.spec.ts:139:7

# Error details

```
Error: expect(locator).not.toHaveClass(expected) failed

Locator:  locator('html')
Expected: not ""
Received: ""
Timeout:  15000ms

Call log:
  - Expect "not toHaveClass" locator('html') with timeout 15000ms
  - waiting for locator('html')
    33 × locator resolved to <html lang="fa" dir="rtl" data-theme="dark">…</html>
       - unexpected value ""

```

```yaml
- document:
  - banner
  - main
  - contentinfo
  - alert
```

# Test source

```ts
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
  112 |     await page.goto("/");
  113 |     const nav = page.getByRole("navigation", { name: "ناوبری اصلی" });
  114 | 
  115 |     for (const [label, path] of [
  116 |       ["دوره‌ها", "/courses"],
  117 |       ["وبلاگ", "/blog"],
  118 |       ["درباره مدرس", "/instructor"],
  119 |       ["تماس", "/contact"],
  120 |     ] as const) {
  121 |       await nav.getByRole("link", { name: label }).click();
  122 |       await expect(page).toHaveURL(new RegExp(`${path}$`));
  123 |     }
  124 | 
  125 |     expectNoClientErrors(diag);
  126 |   });
  127 | 
  128 |   test("footer links and support address are present", async ({ page, diag }) => {
  129 |     await page.goto("/");
  130 |     const footer = page.getByRole("navigation", { name: "ناوبری پابرگ" });
  131 | 
  132 |     await expect(footer.getByRole("link", { name: "دوره‌ها" })).toBeVisible();
  133 |     await expect(footer.getByRole("link", { name: "وبلاگ" })).toBeVisible();
  134 |     await expect(page.getByRole("link", { name: "support@golearn.ir" })).toBeVisible();
  135 | 
  136 |     expectNoClientErrors(diag);
  137 |   });
  138 | 
  139 |   test("theme toggle switches the colour scheme", async ({ page, diag }) => {
  140 |     await page.goto("/");
  141 |     const html = page.locator("html");
  142 |     const before = await html.getAttribute("class");
  143 | 
  144 |     await page.getByRole("button", { name: "تغییر تم روشن و تاریک" }).click();
> 145 |     await expect(html).not.toHaveClass(before ?? "");
      |                            ^ Error: expect(locator).not.toHaveClass(expected) failed
  146 | 
  147 |     expectNoClientErrors(diag);
  148 |   });
  149 | 
  150 |   test("robots.txt and sitemap.xml are served", async ({ request }) => {
  151 |     for (const path of ["/robots.txt", "/sitemap.xml"]) {
  152 |       const res = await request.get(path);
  153 |       expect(res.status(), `${path} should be served`).toBe(200);
  154 |     }
  155 |   });
  156 | });
  157 | 
```