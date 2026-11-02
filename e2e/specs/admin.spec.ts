import {
  API_URL,
  createPublishedCourse,
  expect,
  expectNoClientErrors,
  FIXTURE_PNG,
  sessionCookies,
  test,
  uniqueMobile,
} from "../lib/helpers";

test.describe("admin console", () => {
  test.use({ sessionRole: "admin" });

  /** Unique per test — the suite may run against a shared database. */
  const tag = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 90 + 10)}`;

  test("the overview shows the platform numbers", async ({ page, diag }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
    await expect(page.getByText("درآمد").first()).toBeVisible();
    await expect(page.getByText("سفارش‌ها").first()).toBeVisible();
    await expect(page.getByText("کاربران تازه").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a course is created, gets a curriculum, is published and shows up on the site", async ({
    page,
    diag,
  }) => {
    const courseTitle = `دورهٔ مدیریت تست ${tag()}`;
    const courseSlug = `e2e-admin-${tag()}`;

    await page.goto("/admin/courses/new");

    await page.locator("#c-title").fill(courseTitle);
    await page.locator("#c-slug").fill(courseSlug);
    await page.locator("#c-level").selectOption("beginner");
    await page.locator("#c-price").fill("25000");
    await page.locator("#c-summary").fill("خلاصهٔ دورهٔ ساخته‌شده توسط تست خودکار.");
    await page.getByRole("button", { name: "ساخت دوره" }).click();

    await expect(page.getByText("ذخیره شد")).toBeVisible();

    // the course is listed
    await page.goto("/admin/courses");
    await page.locator("#course-q").fill(courseTitle);
    await page.getByRole("button", { name: "اعمال" }).click();

    const row = page.getByRole("row").filter({ hasText: courseTitle });
    await expect(row).toHaveCount(1);

    // curriculum: one section with one ready lesson
    await row.getByRole("link", { name: "ویرایش" }).click();
    await expect(page.getByRole("heading", { name: "ویرایش دوره" })).toBeVisible();

    await page.getByRole("tab", { name: "سرفصل" }).click();
    await page.locator("#new-section").fill("بخش تست مدیریت");
    await page.getByRole("button", { name: "افزودن بخش" }).click();
    await expect(page.getByText("بخش تست مدیریت")).toBeVisible();

    await page.getByRole("button", { name: "افزودن درس" }).click();
    await page.locator("#lesson-title").fill("درس تست مدیریت");
    await page.locator("#lesson-duration").fill("5");
    await page.locator("#lesson-status").selectOption("ready");
    await page.getByRole("button", { name: "افزودن درس", exact: true }).click();
    await expect(page.getByText("درس تست مدیریت")).toBeVisible();

    // publish from the list
    await page.goto("/admin/courses");
    await page.locator("#course-q").fill(courseTitle);
    await page.getByRole("button", { name: "اعمال" }).click();
    const publishRow = page.getByRole("row").filter({ hasText: courseTitle });
    await publishRow.getByRole("button", { name: "انتشار" }).click();
    await expect(publishRow.getByText("منتشرشده").first()).toBeVisible();

    // the course is now on the public site
    await page.goto(`/courses/${courseSlug}`);
    await expect(page.getByRole("heading", { name: courseTitle })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the course list can be searched by slug", async ({ page, diag, playwright }) => {
    const api = await playwright.request.newContext({ baseURL: API_URL });
    const course = await createPublishedCourse(
      api,
      `دورهٔ نامک تست ${tag()}`,
      await sessionCookies(playwright, "admin"),
    );
    await api.dispose();

    await page.goto("/admin/courses");
    await page.locator("#course-q").fill(course.slug);
    await page.getByRole("button", { name: "اعمال" }).click();

    // the placeholder promises "title or slug" and every row shows its slug
    await expect(page.getByRole("row").filter({ hasText: course.slug })).toHaveCount(1);

    expectNoClientErrors(diag);
  });

  test("the cover image is uploaded through the media field", async ({
    page,
    diag,
    playwright,
  }) => {
    const title = `دورهٔ کاور تست ${tag()}`;
    const api = await playwright.request.newContext({ baseURL: API_URL });
    const course = await createPublishedCourse(api, title, await sessionCookies(playwright, "admin"));
    await api.dispose();

    await page.goto("/admin/courses");
    await page.locator("#course-q").fill(title);
    await page.getByRole("button", { name: "اعمال" }).click();
    await page
      .getByRole("row")
      .filter({ hasText: course.slug })
      .getByRole("link", { name: "ویرایش" })
      .click();

    await page.getByRole("tab", { name: "رسانه و سئو" }).click();
    await page.getByLabel("بارگذاری تصویر کاور").setInputFiles(FIXTURE_PNG);

    await expect(page.getByText("فایل بارگذاری شد و در حال پردازش است.")).toBeVisible({
      timeout: 30000,
    });

    // the asset is listed in the media library
    await page.goto("/admin/media");
    await expect(page.getByRole("heading", { name: "رسانه‌ها" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a blog post is written, published, visible on the blog and deletable", async ({
    page,
    diag,
  }) => {
    const postTitle = `نوشتهٔ تست E2E ${tag()}`;
    const postSlug = `e2e-post-${tag()}`;

    await page.goto("/admin/posts/new");

    await page.locator("#p-title").fill(postTitle);
    await page.locator("#p-slug").fill(postSlug);
    await page.locator("#p-excerpt").fill("خلاصهٔ نوشتهٔ تست خودکار.");
    await page.getByRole("tab", { name: "بدنه" }).click();
    await page.locator('#p-body [contenteditable="true"]').click();
    await page.locator('#p-body [contenteditable="true"]').pressSequentially("متن نوشتهٔ تست خودکار.");
    await page.getByRole("button", { name: "ساخت نوشته" }).click();

    await expect(page.getByText("ذخیره شد")).toBeVisible();

    await page.goto("/admin/posts");
    await page.locator("#post-q").fill(postTitle);
    await page.getByRole("button", { name: "اعمال" }).click();

    const row = page.getByRole("row").filter({ hasText: postTitle });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: "انتشار" }).click();
    await expect(row.getByText("منتشرشده").first()).toBeVisible({ timeout: 30000 });

    // it shows up on the public blog
    await page.goto(`/blog/${postSlug}`);
    await expect(page.getByRole("heading", { name: postTitle })).toBeVisible();

    // and can be deleted again
    await page.goto("/admin/posts");
    await page.locator("#post-q").fill(postTitle);
    await page.getByRole("button", { name: "اعمال" }).click();
    const delRow = page.getByRole("row").filter({ hasText: postTitle });
    await delRow.getByRole("button", { name: "حذف" }).click();
    await page.getByRole("button", { name: "حذف نوشته" }).click();
    await expect(delRow).toHaveCount(0);

    expectNoClientErrors(diag);
  });

  test("a coupon is created and switched off", async ({ page, diag }) => {
    const couponCode = `E2E${tag().toUpperCase()}`;

    await page.goto("/admin/coupons");

    await page.getByRole("button", { name: "کد تازه" }).click();
    await page.locator("#c-code").fill(couponCode);
    await page.locator("#c-type").selectOption("percent");
    await page.locator("#c-value").fill("15");
    await page.getByRole("button", { name: "ساخت کد تخفیف" }).click();

    const row = page.getByRole("row").filter({ hasText: couponCode });
    await expect(row).toHaveCount(1);
    await expect(row.getByText("15٪")).toBeVisible();

    await row.getByRole("button", { name: "غیرفعال کردن" }).click();
    await expect(row.getByText("غیرفعال")).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a course category can be created", async ({ page, diag }) => {
    await page.goto("/admin/categories");

    const title = `دستهٔ تست ${tag()}`;
    await page.locator("#course-cat").fill(title);
    await page.getByRole("button", { name: "افزودن" }).first().click();

    await expect(page.getByText(title).first()).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("an admin can block and unblock a user", async ({ page, diag, playwright }) => {
    const blockedName = `کاربر مسدود تست ${tag()}`;
    const mobile = uniqueMobile();
    const api = await playwright.request.newContext({ baseURL: API_URL });
    await api.post("/api/v1/auth/register", {
      data: { full_name: blockedName, mobile, password: "Blocked2026" },
    });
    await api.dispose();

    await page.goto("/admin/users");
    await page.locator("#user-q").fill(blockedName);
    await page.getByRole("button", { name: "جست‌وجو" }).click();

    const row = page.getByRole("row").filter({ hasText: blockedName });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: "مسدودسازی" }).click();
    await expect(row.getByText("مسدود").first()).toBeVisible();

    await row.getByRole("button", { name: "رفع مسدودی" }).click();
    await expect(row.getByText("فعال").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a contact message reaches the admin inbox and can be closed", async ({
    page,
    diag,
    context,
  }) => {
    const csrf = (await context.cookies()).find((c) => c.name === "gl_csrf")?.value ?? "";
    const res = await page.request.post(`${API_URL}/api/v1/contact`, {
      headers: { "X-CSRF-Token": csrf },
      data: {
        name: "کاربر پیام تست",
        contact: "09121110077",
        body: "این پیام برای تست خودکار مدیریت ارسال شده است.",
      },
    });
    if (res.status() === 429) {
      test.skip(true, "the contact endpoint is rate limited (5/hour per IP)");
    }
    expect(res.status()).toBe(200);

    await page.goto("/admin/messages");
    await expect(page.getByRole("heading", { name: "پیام‌های تماس" })).toBeVisible();
    await expect(page.getByText("کاربر پیام تست").first()).toBeVisible();

    await page.getByRole("button", { name: "بستن" }).first().click();
    await expect(page.getByText("بسته").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a paid order can be refunded from the admin console", async ({
    page,
    diag,
    browser,
    playwright,
  }) => {
    // the learner buys a course so there is a paid order to refund
    const adminCookies = await sessionCookies(playwright, "admin");
    const adminCtx = await browser.newContext();
    await adminCtx.addCookies(adminCookies);
    const course = await createPublishedCourse(
      adminCtx.request,
      `دورهٔ بازگشت وجه تست ${tag()}`,
      adminCookies,
    );
    await adminCtx.close();

    const learnerCtx = await browser.newContext();
    await learnerCtx.addCookies(await sessionCookies(playwright, "learner"));
    const buyer = await learnerCtx.newPage();
    await buyer.goto(`/checkout?course=${course.slug}`);
    await buyer.getByText("قابل پرداخت").waitFor();
    await buyer.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await buyer.waitForURL(/localhost:8082/, { timeout: 20000 });
    await buyer.getByRole("link", { name: "پرداخت موفق" }).click();
    await buyer.waitForURL(/\/checkout\/result/, { timeout: 20000 });
    await learnerCtx.close();

    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: "سفارش‌ها" })).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: "پرداخت‌شده" }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "بازگشت وجه" }).click();

    await page.locator("#refund-reason").fill("بازگشت وجه تست خودکار");
    await page.getByRole("button", { name: "ثبت بازگشت وجه" }).click();

    await expect(page.getByText("بازگشت‌خورده").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the settings are saved", async ({ page, diag }) => {
    await page.goto("/admin/settings");

    const title = page.locator("#s-title");
    await expect(title).toBeVisible();
    const original = await title.inputValue();

    await title.fill(`${original} (E2E)`);
    await page.getByRole("button", { name: "ذخیره تنظیمات" }).click();
    await expect(page.getByText("تنظیمات ذخیره شد.")).toBeVisible();

    // restore
    await title.fill(original);
    await page.getByRole("button", { name: "ذخیره تنظیمات" }).click();
    await expect(page.getByText("تنظیمات ذخیره شد.")).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the audit log lists the admin mutations", async ({ page, diag }) => {
    await page.goto("/admin/audit-logs");

    await expect(page.getByRole("heading", { name: "گزارش رویدادها" })).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("a learner cannot open the admin console", async ({ page, diag, browser, playwright }) => {
    const learnerCtx = await browser.newContext();
    await learnerCtx.addCookies(await sessionCookies(playwright, "learner"));
    const learnerPage = await learnerCtx.newPage();

    await learnerPage.goto("/admin");
    await expect(learnerPage.getByText("این بخش فقط برای مدیران است.")).toBeVisible();

    await learnerCtx.close();
    expectNoClientErrors(diag);
  });
});
