# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> authentication >> registration rejects a password that is too short
- Location: specs/auth.spec.ts:31:7

# Error details

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
  - waiting for getByLabel('نام و نام خانوادگی')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]: Internal Server Error
```

# Test source

```ts
  1   | import {
  2   |   expect,
  3   |   expectNoClientErrors,
  4   |   fillOtp,
  5   |   credentials,
  6   |   loginThroughUi,
  7   |   readOtpFromLog,
  8   |   test,
  9   |   uniqueMobile,
  10  | } from "../lib/helpers";
  11  | 
  12  | test.describe("authentication", () => {
  13  |   test("a new mobile registers, verifies the OTP and lands on the dashboard", async ({ page, diag }) => {
  14  |     const mobile = uniqueMobile();
  15  | 
  16  |     await page.goto("/register");
  17  |     await page.getByLabel("نام و نام خانوادگی").fill("کاربر تازهٔ تست");
  18  |     await page.getByLabel("شماره موبایل").fill(mobile);
  19  |     await page.getByLabel("رمز عبور").fill("E2Enewuser2026");
  20  |     await page.getByRole("button", { name: "ثبت‌نام" }).click();
  21  | 
  22  |     await expect(page.getByRole("heading", { name: "تأیید شماره موبایل" })).toBeVisible();
  23  | 
  24  |     await fillOtp(page, readOtpFromLog(mobile));
  25  |     await page.waitForURL("**/dashboard", { timeout: 20000 });
  26  | 
  27  |     await expect(page.getByRole("heading", { name: "کاربر تازهٔ تست" })).toBeVisible();
  28  |     expectNoClientErrors(diag);
  29  |   });
  30  | 
  31  |   test("registration rejects a password that is too short", async ({ page, diag }) => {
  32  |     await page.goto("/register");
> 33  |     await page.getByLabel("نام و نام خانوادگی").fill("کاربر بد رمز");
      |                                                 ^ TimeoutError: locator.fill: Timeout 20000ms exceeded.
  34  |     await page.getByLabel("شماره موبایل").fill(uniqueMobile());
  35  |     await page.getByLabel("رمز عبور").fill("1234");
  36  |     await page.getByRole("button", { name: "ثبت‌نام" }).click();
  37  | 
  38  |     const alert = page.locator('[role="alert"], [role="status"]').first();
  39  |     await expect(alert).toBeVisible();
  40  |     await expect(page).toHaveURL(/\/register/);
  41  |     expectNoClientErrors(diag);
  42  |   });
  43  | 
  44  |   test("login with a wrong password shows an error and stays on the login page", async ({
  45  |     page,
  46  |     diag,
  47  |   }) => {
  48  |     await page.goto("/login");
  49  |     await page.getByLabel("شماره موبایل").fill(credentials().learner.mobile);
  50  |     await page.getByLabel("رمز عبور").fill("wrong-password-1");
  51  |     await page.getByRole("button", { name: "ورود", exact: true }).click();
  52  | 
  53  |     const alert = page.locator('[role="alert"], [role="status"]').first();
  54  |     await expect(alert).toBeVisible();
  55  |     await expect(page).toHaveURL(/\/login/);
  56  |     expectNoClientErrors(diag);
  57  |   });
  58  | 
  59  |   test("login with the correct password opens the learner dashboard", async ({ page, diag }) => {
  60  |     await loginThroughUi(page, credentials().learner.mobile, credentials().learner.password);
  61  | 
  62  |     await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
  63  |     await expect(page.getByRole("heading", { name: "دوره‌های من" })).toBeVisible();
  64  |     expectNoClientErrors(diag);
  65  |   });
  66  | 
  67  |   test("login with an SMS code opens the learner dashboard", async ({ page, diag }) => {
  68  |     await page.goto("/login");
  69  |     await page.getByRole("button", { name: "کد پیامکی" }).click();
  70  |     await page.getByLabel("شماره موبایل").fill(credentials().learner.mobile);
  71  |     await page.getByRole("button", { name: "ارسال کد تأیید" }).click();
  72  | 
  73  |     await expect(page.getByRole("heading", { name: "کد تأیید را وارد کن" })).toBeVisible();
  74  |     await fillOtp(page, readOtpFromLog(credentials().learner.mobile));
  75  |     await page.waitForURL("**/dashboard", { timeout: 20000 });
  76  | 
  77  |     await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
  78  |     expectNoClientErrors(diag);
  79  |   });
  80  | 
  81  |   test("logout clears the session and returns to the login page", async ({ page, diag }) => {
  82  |     await loginThroughUi(page, credentials().learner.mobile, credentials().learner.password);
  83  | 
  84  |     await page.getByRole("button", { name: "خروج از حساب" }).click();
  85  |     await page.waitForURL("**/login", { timeout: 20000 });
  86  | 
  87  |     await expect(page.getByRole("button", { name: "ورود", exact: true })).toBeVisible();
  88  |     expectNoClientErrors(diag);
  89  |   });
  90  | 
  91  |   test("the dashboard asks anonymous visitors to sign in", async ({ page, diag }) => {
  92  |     await page.goto("/dashboard");
  93  | 
  94  |     await expect(page.getByText("برای دیدن داشبورد ابتدا وارد شو")).toBeVisible();
  95  |     await expect(page.getByRole("link", { name: "ورود به حساب" })).toBeVisible();
  96  |     expectNoClientErrors(diag);
  97  |   });
  98  | 
  99  |   test("a signed-in learner sees the dashboard entry in the navbar", async ({ page, diag }) => {
  100 |     await loginThroughUi(page, credentials().learner.mobile, credentials().learner.password);
  101 | 
  102 |     const nav = page.getByRole("navigation", { name: "ناوبری اصلی" });
  103 |     await expect(nav.getByRole("link", { name: "داشبورد" })).toBeVisible();
  104 |     expectNoClientErrors(diag);
  105 |   });
  106 | });
  107 | 
```