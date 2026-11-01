import {
  expect,
  expectNoClientErrors,
  fillOtp,
  credentials,
  loginThroughUi,
  readOtpFromLog,
  test,
  uniqueMobile,
} from "../lib/helpers";

test.describe("authentication", () => {
  test("a new mobile registers, verifies the OTP and lands on the dashboard", async ({ page, diag }) => {
    const mobile = uniqueMobile();

    await page.goto("/register");
    await page.getByLabel("نام و نام خانوادگی").fill("کاربر تازهٔ تست");
    await page.getByLabel("شماره موبایل").fill(mobile);
    await page.getByLabel("رمز عبور").fill("E2Enewuser2026");
    await page.getByRole("button", { name: "ثبت‌نام" }).click();

    await expect(page.getByRole("heading", { name: "تأیید شماره موبایل" })).toBeVisible();

    await fillOtp(page, readOtpFromLog(mobile));
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    await expect(page.getByRole("heading", { name: "کاربر تازهٔ تست" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("registration rejects a password that is too short", async ({ page, diag }) => {
    await page.goto("/register");
    await page.getByLabel("نام و نام خانوادگی").fill("کاربر بد رمز");
    await page.getByLabel("شماره موبایل").fill(uniqueMobile());
    await page.getByLabel("رمز عبور").fill("1234");
    await page.getByRole("button", { name: "ثبت‌نام" }).click();

    const alert = page.locator('[role="alert"], [role="status"]').first();
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
    expectNoClientErrors(diag);
  });

  test("login with a wrong password shows an error and stays on the login page", async ({
    page,
    diag,
  }) => {
    await page.goto("/login");
    await page.getByLabel("شماره موبایل").fill(credentials().learner.mobile);
    await page.getByLabel("رمز عبور").fill("wrong-password-1");
    await page.getByRole("button", { name: "ورود", exact: true }).click();

    const alert = page.locator('[role="alert"], [role="status"]').first();
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expectNoClientErrors(diag);
  });

  test("login with the correct password opens the learner dashboard", async ({ page, diag }) => {
    await loginThroughUi(page, credentials().learner.mobile, credentials().learner.password);

    await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "دوره‌های من" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("login with an SMS code opens the learner dashboard", async ({ page, diag }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "کد پیامکی" }).click();
    await page.getByLabel("شماره موبایل").fill(credentials().learner.mobile);
    await page.getByRole("button", { name: "ارسال کد تأیید" }).click();

    await expect(page.getByRole("heading", { name: "کد تأیید را وارد کن" })).toBeVisible();
    await fillOtp(page, readOtpFromLog(credentials().learner.mobile));
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("logout clears the session and returns to the login page", async ({ page, diag }) => {
    await loginThroughUi(page, credentials().learner.mobile, credentials().learner.password);

    await page.getByRole("button", { name: "خروج از حساب" }).click();
    await page.waitForURL("**/login", { timeout: 20000 });

    await expect(page.getByRole("button", { name: "ورود", exact: true })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("the dashboard asks anonymous visitors to sign in", async ({ page, diag }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("برای دیدن داشبورد ابتدا وارد شو")).toBeVisible();
    await expect(page.getByRole("link", { name: "ورود به حساب" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("a signed-in learner sees the dashboard entry in the navbar", async ({ page, diag }) => {
    await loginThroughUi(page, credentials().learner.mobile, credentials().learner.password);

    const nav = page.getByRole("navigation", { name: "ناوبری اصلی" });
    await expect(nav.getByRole("link", { name: "داشبورد" })).toBeVisible();
    expectNoClientErrors(diag);
  });
});
