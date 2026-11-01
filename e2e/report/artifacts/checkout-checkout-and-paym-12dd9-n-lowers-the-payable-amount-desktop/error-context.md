# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> checkout and payment >> a coupon lowers the payable amount
- Location: specs/checkout.spec.ts:117:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('تخفیف')
Expected: visible
Error: strict mode violation: getByText('تخفیف') resolved to 2 elements:
    1) <span class="text-foreground">دورهٔ تخفیف تست 1793576421924</span> aka getByText('دورهٔ تخفیف تست')
    2) <label for="coupon" class="block text-sm font-medium text-foreground">کد تخفیف</label> aka getByText('کد تخفیف')

Call log:
  - Expect "toBeVisible" getByText('تخفیف') with timeout 15000ms
  - waiting for getByText('تخفیف')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "گوLearn" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation "ناوبری اصلی" [ref=e5]:
        - link "دوره‌ها" [ref=e6] [cursor=pointer]:
          - /url: /courses
        - link "وبلاگ" [ref=e7] [cursor=pointer]:
          - /url: /blog
        - link "درباره مدرس" [ref=e8] [cursor=pointer]:
          - /url: /instructor
        - link "تماس" [ref=e9] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e10]:
        - button "تغییر تم روشن و تاریک" [ref=e11] [cursor=pointer]
        - link "داشبورد" [ref=e15] [cursor=pointer]:
          - /url: /dashboard
  - main [ref=e16]:
    - generic [ref=e17]:
      - heading "تسویه حساب" [level=1] [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: دورهٔ تخفیف تست 1793576421924
            - generic [ref=e23]: ۲۰٬۰۰۰ تومان
          - generic [ref=e24]:
            - generic [ref=e25]: تخفیف
            - generic [ref=e26]: ۲٬۰۰۰ تومان
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e29]: قابل پرداخت
              - generic [ref=e30]: ۱۸٬۰۰۰ تومان
            - paragraph [ref=e31]: "مهلت پرداخت: ۳۰ دقیقه"
        - generic [ref=e32]:
          - generic [ref=e33]:
            - generic [ref=e34] [cursor=pointer]: کد تخفیف
            - textbox "کد تخفیف" [ref=e35]:
              - /placeholder: مثلاً WELCOME
              - text: E۲E۱۰
          - button "اعمال" [ref=e36] [cursor=pointer]
        - generic [ref=e37]:
          - paragraph [ref=e38]: انتخاب درگاه پرداخت
          - button "پرداخت با زرین‌پال" [ref=e39] [cursor=pointer]
          - button "درگاه آزمایشی" [ref=e40] [cursor=pointer]
          - paragraph [ref=e41]: درگاه آزمایشی فقط برای تست نصب است.
  - contentinfo [ref=e42]:
    - generic [ref=e43]:
      - generic [ref=e44]:
        - paragraph [ref=e45]: گوLearn
        - paragraph [ref=e46]: دوره‌های ویدیویی برنامه‌نویسی به فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.
      - navigation "ناوبری پابرگ" [ref=e47]:
        - link "دوره‌ها" [ref=e48] [cursor=pointer]:
          - /url: /courses
        - link "وبلاگ" [ref=e49] [cursor=pointer]:
          - /url: /blog
        - link "درباره مدرس" [ref=e50] [cursor=pointer]:
          - /url: /instructor
        - link "تماس" [ref=e51] [cursor=pointer]:
          - /url: /contact
        - link "support@golearn.ir" [ref=e52] [cursor=pointer]:
          - /url: mailto:support@golearn.ir
    - generic [ref=e53]: گوLearn ،۱۴۰۵. همه محتوا متعلق به این رسانه است.
  - generic [ref=e58] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e59]
    - generic [ref=e63]:
      - button "Open issues overlay" [ref=e64]:
        - generic [ref=e65]:
          - generic [aria-hidden] [ref=e66]: "0"
          - generic [ref=e67]: "1"
        - generic [ref=e68]: Issue
      - button "Collapse issues badge" [ref=e69]
  - alert [ref=e72]
```

# Test source

```ts
  31  |       storageState: ADMIN_STATE,
  32  |     });
  33  |     const course = await createPublishedCourse(adminCtx, `دورهٔ خرید تست ${Date.now()}`);
  34  |     await adminCtx.dispose();
  35  | 
  36  |     await page.goto(`/checkout?course=${course.slug}`);
  37  |     await expect(page.getByRole("heading", { name: "تسویه حساب" })).toBeVisible();
  38  |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  39  | 
  40  |     await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
  41  |     await page.waitForURL(/localhost:8082/, { timeout: 20000 });
  42  |     await page.getByRole("link", { name: "پرداخت موفق" }).click();
  43  | 
  44  |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
  45  |     await expect(page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" })).toBeVisible();
  46  | 
  47  |     // the entitlement shows up on the public course page and in the dashboard
  48  |     await page.goto(`/courses/${course.slug}`);
  49  |     await expect(page.getByText("این دوره را خریده‌اید").first()).toBeVisible();
  50  | 
  51  |     await page.goto("/dashboard");
  52  |     await expect(page.getByRole("link", { name: new RegExp(course.slug) })).toBeVisible();
  53  |     await expect(page.getByRole("link", { name: new RegExp("ادامه یادگیری|شروع دوره") })).toBeVisible();
  54  | 
  55  |     expectNoClientErrors(diag);
  56  |   });
  57  | 
  58  |   test("buying the same course twice is refused", async ({ page, diag, playwright }) => {
  59  |     const adminCtx = await playwright.request.newContext({
  60  |       baseURL: API_URL,
  61  |       storageState: ADMIN_STATE,
  62  |     });
  63  |     const course = await createPublishedCourse(adminCtx, `دورهٔ تکراری تست ${Date.now()}`);
  64  |     await adminCtx.dispose();
  65  | 
  66  |     await page.goto(`/checkout?course=${course.slug}`);
  67  |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  68  |     await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
  69  |     await page.waitForURL(/localhost:8082/, { timeout: 20000 });
  70  |     await page.getByRole("link", { name: "پرداخت موفق" }).click();
  71  |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
  72  | 
  73  |     await page.goto(`/checkout?course=${course.slug}`);
  74  |     await expect(page.getByRole("heading", { name: "این دوره را خریده‌اید" })).toBeVisible();
  75  |     await expect(page.getByRole("link", { name: "ادامه یادگیری" })).toBeVisible();
  76  | 
  77  |     expectNoClientErrors(diag);
  78  |   });
  79  | 
  80  |   test("a cancelled payment keeps the order payable and a retry succeeds", async ({
  81  |     page,
  82  |     diag,
  83  |     playwright,
  84  |   }) => {
  85  |     const adminCtx = await playwright.request.newContext({
  86  |       baseURL: API_URL,
  87  |       storageState: ADMIN_STATE,
  88  |     });
  89  |     const course = await createPublishedCourse(adminCtx, `دورهٔ لغوشده تست ${Date.now()}`);
  90  |     await adminCtx.dispose();
  91  | 
  92  |     await page.goto(`/checkout?course=${course.slug}`);
  93  |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  94  |     await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
  95  |     await page.waitForURL(/localhost:8082/, { timeout: 20000 });
  96  |     await page.getByRole("link", { name: "انصراف / شکست" }).click();
  97  | 
  98  |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
  99  |     await expect(page.getByRole("heading", { name: "پرداخت انجام نشد" })).toBeVisible();
  100 | 
  101 |     // the order is still waiting for payment
  102 |     await page.goto("/dashboard/orders");
  103 |     await expect(page.getByText("در انتظار پرداخت").first()).toBeVisible();
  104 | 
  105 |     // retry with the same course succeeds
  106 |     await page.goto(`/checkout?course=${course.slug}`);
  107 |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  108 |     await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
  109 |     await page.waitForURL(/localhost:8082/, { timeout: 20000 });
  110 |     await page.getByRole("link", { name: "پرداخت موفق" }).click();
  111 |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
  112 |     await expect(page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" })).toBeVisible();
  113 | 
  114 |     expectNoClientErrors(diag);
  115 |   });
  116 | 
  117 |   test("a coupon lowers the payable amount", async ({ page, diag, playwright }) => {
  118 |     const adminCtx = await playwright.request.newContext({
  119 |       baseURL: API_URL,
  120 |       storageState: ADMIN_STATE,
  121 |     });
  122 |     const course = await createPublishedCourse(adminCtx, `دورهٔ تخفیف تست ${Date.now()}`);
  123 |     await adminCtx.dispose();
  124 | 
  125 |     await page.goto(`/checkout?course=${course.slug}`);
  126 |     await expect(page.getByText("قابل پرداخت")).toBeVisible();
  127 | 
  128 |     await page.getByLabel("کد تخفیف").fill(COUPON_CODE);
  129 |     await page.getByRole("button", { name: "اعمال" }).click();
  130 | 
> 131 |     await expect(page.getByText("تخفیف")).toBeVisible();
      |                                           ^ Error: expect(locator).toBeVisible() failed
  132 |     expectNoClientErrors(diag);
  133 |   });
  134 | 
  135 |   test("checkout without a course shows the empty state", async ({ page, diag }) => {
  136 |     await page.goto("/checkout");
  137 | 
  138 |     await expect(page.getByText("دوره‌ای انتخاب نشده است")).toBeVisible();
  139 |     expectNoClientErrors(diag);
  140 |   });
  141 | });
  142 | 
```