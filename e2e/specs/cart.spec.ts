import {
  API_URL,
  createPublishedCourse,
  expect,
  expectNoClientErrors,
  sessionCookies,
  test,
} from "../lib/helpers";

test.describe("shopping cart", () => {
  test.use({ sessionRole: "learner" });

  test("the cart collects courses, removes one, and pays the rest in one order", async ({
    page,
    diag,
    playwright,
  }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    const adminCookies = await sessionCookies(playwright, "admin");
    const c1 = await createPublishedCourse(adminCtx, `سبد تست یک ${Date.now()}`, adminCookies);
    const c2 = await createPublishedCourse(adminCtx, `سبد تست دو ${Date.now()}`, adminCookies);
    const c3 = await createPublishedCourse(adminCtx, `سبد تست سه ${Date.now()}`, adminCookies);
    await adminCtx.dispose();

    for (const c of [c1, c2, c3]) {
      await page.goto(`/courses/${c.slug}`);
      await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
      await expect(page.getByRole("link", { name: "مشاهده سبد خرید" }).first()).toBeVisible();
    }

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "سبد خرید" })).toBeVisible();
    await expect(page.getByText("قابل پرداخت")).toBeVisible();

    // removing an item updates the list and the totals
    await page.getByRole("button", { name: new RegExp(`حذف سبد تست سه`) }).click();
    await expect(page.getByText("سبد تست سه")).toBeHidden();

    // two courses at ۲۰٬۰۰۰ تومان each → ۴۰٬۰۰۰ تومان payable
    await expect(page.getByText("۴۰٬۰۰۰ تومان").first()).toBeVisible();

    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();
    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" })).toBeVisible();

    // every course in the order is owned, and the cart emptied itself
    for (const c of [c1, c2]) {
      await page.goto(`/courses/${c.slug}`);
      await expect(page.getByText("این دوره را خریده‌اید").first()).toBeVisible();
    }
    await page.goto("/cart");
    await expect(page.getByText("سبد خرید خالی است")).toBeVisible();
    // the removed course was never paid for
    await page.goto(`/courses/${c3.slug}`);
    await expect(page.getByRole("button", { name: "افزودن به سبد خرید" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a failed payment is resumable from the orders list without a second order", async ({
    page,
    diag,
    playwright,
  }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    const course = await createPublishedCourse(
      adminCtx,
      `ادامهٔ پرداخت تست ${Date.now()}`,
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

    // the failed result leads straight back into the pending order
    await page.getByRole("link", { name: "تلاش مجدد برای پرداخت" }).click();
    await page.waitForURL(/\/checkout\?order=/, { timeout: 20000 });
    await expect(page.getByText("قابل پرداخت")).toBeVisible();
    const orderId = new URL(page.url()).searchParams.get("order") ?? "";

    const detailLinks = page.locator("a[aria-label^='جزئیات سفارش']");
    await page.goto("/dashboard/orders");
    const before = await detailLinks.count();
    // the pending row names its course and offers payment
    // (static prefix: getByText on the digit-suffixed title trips a
    //  Playwright text-matcher bug — 'unicode' TypeError)
    await expect(page.getByText("ادامهٔ پرداخت تست").first()).toBeVisible();
    // scope to this order: the learner may hold older pending orders too
    await page.locator(`a[href="/checkout?order=${orderId}"]`).click();
    await page.waitForURL(/\/checkout\?order=/, { timeout: 20000 });
    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();
    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" })).toBeVisible();

    // retry reused the pending order: exactly one order for the whole flow
    await page.goto("/dashboard/orders");
    await expect(detailLinks).toHaveCount(before);
    await expect(page.locator(`a[href="/checkout?order=${orderId}"]`)).toHaveCount(0);

    expectNoClientErrors(diag);
  });

  test("an empty cart sends the visitor to the courses", async ({ page, diag }) => {
    await page.goto("/cart");
    await expect(page.getByText("سبد خرید خالی است")).toBeVisible();
    await expect(page.getByRole("link", { name: "دیدن دوره‌ها" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("a guest cart asks for sign-in only at pay time", async ({ page, diag, playwright }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    const course = await createPublishedCourse(
      adminCtx,
      `سبد مهمان تست ${Date.now()}`,
      await sessionCookies(playwright, "admin"),
    );
    await adminCtx.dispose();

    await page.context().clearCookies();
    await page.goto(`/courses/${course.slug}`);
    await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
    await page.goto("/cart");
    await expect(page.getByText("سبد مهمان تست").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "ورود به حساب" })).toBeVisible();

    expectNoClientErrors(diag);
  });
});
