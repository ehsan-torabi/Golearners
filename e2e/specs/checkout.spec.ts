import {
  API_URL,
  COUPON_CODE,
  credentials,
  createPublishedCourse,
  expect,
  expectNoClientErrors,
  sessionCookies,
  test,
} from "../lib/helpers";

test.describe("checkout and payment", () => {
  test.use({ sessionRole: "learner" });

  test("a guest is asked to sign in before paying", async ({ page, diag }) => {
    await page.context().clearCookies();
    await page.goto("/checkout?course=go-from-zero");

    await expect(page.getByRole("heading", { name: "برای خرید ابتدا وارد شو" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ورود به حساب" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("the learner buys a course with the mock gateway and gets access", async ({
    page,
    diag,
    playwright,
  }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    const course = await createPublishedCourse(
      adminCtx,
      `دورهٔ خرید تست ${Date.now()}`,
      await sessionCookies(playwright, "admin"),
    );
    await adminCtx.dispose();

    await page.goto(`/checkout?course=${course.slug}`);
    await expect(page.getByRole("heading", { name: "تسویه حساب" })).toBeVisible();
    await expect(page.getByText("قابل پرداخت")).toBeVisible();

    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();

    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" })).toBeVisible();

    // the entitlement shows up on the public course page and in the dashboard
    await page.goto(`/courses/${course.slug}`);
    await expect(page.getByText("این دوره را خریده‌اید").first()).toBeVisible();

    await page.goto("/dashboard");
    const card = page.locator(`a[href="/dashboard/courses/${course.slug}"]`);
    await expect(card.first()).toBeVisible();
    // the course card offers "شروع دوره" / "ادامه یادگیری"
    await expect(
      page.getByRole("link", { name: /ادامه یادگیری|شروع دوره/ }).first(),
    ).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("buying the same course twice is refused", async ({ page, diag, playwright }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    await adminCtx.storageState;
    const course = await createPublishedCourse(
      adminCtx,
      `دورهٔ تکراری تست ${Date.now()}`,
      await sessionCookies(playwright, "admin"),
    );
    await adminCtx.dispose();

    await page.goto(`/checkout?course=${course.slug}`);
    await expect(page.getByText("قابل پرداخت")).toBeVisible();
    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();
    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });

    await page.goto(`/checkout?course=${course.slug}`);
    await expect(page.getByRole("heading", { name: "این دوره را خریده‌اید" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ادامه یادگیری" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a cancelled payment keeps the order payable and a retry succeeds", async ({
    page,
    diag,
    playwright,
  }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    await adminCtx.storageState;
    const course = await createPublishedCourse(
      adminCtx,
      `دورهٔ لغوشده تست ${Date.now()}`,
      await sessionCookies(playwright, "admin"),
    );
    await adminCtx.dispose();

    await page.goto(`/checkout?course=${course.slug}`);
    await expect(page.getByText("قابل پرداخت")).toBeVisible();
    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "انصراف / شکست" }).click();

    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "پرداخت انجام نشد" })).toBeVisible();

    // the order is still waiting for payment
    await page.goto("/dashboard/orders");
    await expect(page.getByText("در انتظار پرداخت").first()).toBeVisible();

    // retry with the same course succeeds
    await page.goto(`/checkout?course=${course.slug}`);
    await expect(page.getByText("قابل پرداخت")).toBeVisible();
    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();
    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a coupon lowers the payable amount", async ({ page, diag, playwright }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    await adminCtx.storageState;
    const course = await createPublishedCourse(
      adminCtx,
      `دورهٔ کد تخفیف تست ${Date.now()}`,
      await sessionCookies(playwright, "admin"),
    );
    await adminCtx.dispose();

    await page.goto(`/checkout?course=${course.slug}`);
    await expect(page.getByText("قابل پرداخت")).toBeVisible();

    await page.getByLabel("کد تخفیف").fill(COUPON_CODE);
    await page.getByRole("button", { name: "اعمال" }).click();

    await expect(page.getByText("تخفیف", { exact: true })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("checkout without a course shows the empty state", async ({ page, diag }) => {
    await page.goto("/checkout");

    await expect(page.getByText("دوره‌ای انتخاب نشده است")).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("the learner can sign in again after the session is lost", async ({ page, diag }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("شماره موبایل").fill(credentials().learner.mobile);
    await page.getByLabel("رمز عبور").fill(credentials().learner.password);
    await page.locator("form").getByRole("button", { name: "ورود", exact: true }).click();
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    await expect(page.getByRole("heading", { name: "دوره‌های من" })).toBeVisible();
    expectNoClientErrors(diag);
  });
});
