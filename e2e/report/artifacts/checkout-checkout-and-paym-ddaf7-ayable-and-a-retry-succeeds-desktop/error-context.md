# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> checkout and payment >> a cancelled payment keeps the order payable and a retry succeeds
- Location: specs/checkout.spec.ts:80:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f6e1]: "{\"error\":{\"code\":\"INTERNAL_ERROR\",\"message\":\"خطای غیرمنتظره رخ داد؛ لطفاً دوباره تلاش کنید.\"}}"
```

# Test source

```ts
  11  | 
  12  | test.describe("checkout and payment", () => {
  13  |   test.use({ storageState: LEARNER_STATE });
  14  | 
  15  |   test("a guest is asked to sign in before paying", async ({ page, diag }) => {
  16  |     await page.context().clearCookies();
  17  |     await page.goto("/checkout?course=go-from-zero");
  18  | 
  19  |     await expect(page.getByRole("heading", { name: "برای خرید ابتدا وارد شو" })).toBeVisible();
  20  |     await expect(page.getByRole("link", { name: "ورود به حساب" })).toBeVisible();
  21  |     expectNoClientErrors(diag);
  22  |   });
  23  | 
  24  |   test("the learner buys a course with the mock gateway and gets access", async ({
  25  |     page,
  26  |     diag,
  27  |     playwright,
  28  |   }) => {
  29  |     const adminCtx = await playwright.request.newContext({
  30  |       baseURL: API_URL,
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
> 111 |     await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
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
  131 |     await expect(page.getByText("تخفیف")).toBeVisible();
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