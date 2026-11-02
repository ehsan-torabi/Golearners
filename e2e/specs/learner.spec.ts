import {
  API_URL,
  authHeaders,
  createPublishedCourse,
  expect,
  expectNoClientErrors,
  FIXTURE_MP4,
  readOtpFromLog,
  sessionCookies,
  test,
  uniqueMobile,
  uploadMedia,
  waitForMediaReady,
} from "../lib/helpers";

test.describe("learner dashboard", () => {
  test.use({ sessionRole: "learner" });

  const stamp = Date.now();
  let playableSlug = "";
  let lessonTitle = "";
  let plainSlug = "";

  test.beforeAll(async ({ playwright }) => {
    const adminCtx = await playwright.request.newContext({ baseURL: API_URL });
    const adminCookies = await sessionCookies(playwright, "admin");

    // a course whose lesson carries real media so the player can sign a URL
    const asset = await uploadMedia(adminCtx, FIXTURE_MP4, "video/mp4", adminCookies);
    await waitForMediaReady(adminCtx, asset.storage_key, adminCookies);

    const headers = authHeaders(adminCookies);
    const title = `دورهٔ پخش تست ${stamp}`;

    const courseRes = await adminCtx.post("/api/v1/admin/courses", {
      headers,
      data: {
        title,
        slug: `e2e-play-${stamp}`,
        summary: "دورهٔ تست پخش",
        description_html: "<p>محتوای تست</p>",
        level: "beginner",
        price_rial: 300000,
        outcomes: ["تست پخش"],
      },
    });
    const course = (await courseRes.json()) as { id: string; slug: string };

    const sectionRes = await adminCtx.post(`/api/v1/admin/courses/${course.id}/sections`, {
      headers,
      data: { title: "بخش پخش" },
    });
    const section = (await sectionRes.json()) as { id: string };

    lessonTitle = `درس پخش ${stamp}`;
    await adminCtx.post(`/api/v1/admin/sections/${section.id}/lessons`, {
      headers,
      data: {
        title: lessonTitle,
        content_html: "<p>متن درس</p>",
        position: 1,
        is_preview: true,
        duration_seconds: 120,
        status: "ready",
        media_id: asset.id,
      },
    });
    await adminCtx.post(`/api/v1/admin/courses/${course.id}/publish`, { headers });
    playableSlug = course.slug;

    // a second, media-less course used by the orders test
    plainSlug = (
      await createPublishedCourse(adminCtx, `دورهٔ سفارش تست ${stamp}`, adminCookies)
    ).slug;

    await adminCtx.dispose();
  });

  test("the dashboard shows the profile and the learning stats", async ({ page, diag }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
    await expect(page.getByText("دوره‌ها", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("در حال یادگیری")).toBeVisible();
    await expect(page.getByText("تکمیل‌شده")).toBeVisible();
    await expect(page.getByText("میانگین پیشرفت")).toBeVisible();
    await expect(page.getByRole("heading", { name: "دوره‌های من" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the course player lists the lessons and asks for a signed playback URL", async ({
    page,
    diag,
  }) => {
    await page.goto(`/checkout?course=${playableSlug}`);
    await expect(page.getByText("قابل پرداخت")).toBeVisible();
    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();
    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });

    await page.goto(`/dashboard/courses/${playableSlug}`);

    await expect(page.getByRole("heading", { name: lessonTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: "سرفصل‌ها" })).toBeVisible();
    await expect(page.locator("video")).toBeVisible();

    await expect
      .poll(
        () => diag.apiCalls.some((c) => c.startsWith("200 GET") && c.includes("/playback/lessons/")),
        { timeout: 30000 },
      )
      .toBe(true);

    expectNoClientErrors(diag);
  });

  test("the player stores the playback progress", async ({ page, diag }) => {
    await page.goto(`/dashboard/courses/${playableSlug}`);
    await expect(page.locator("video")).toBeVisible();

    // the player attaches its progress listener after the source is set
    await expect
      .poll(
        () => diag.apiCalls.some((c) => c.startsWith("200 GET") && c.includes("/playback/lessons/")),
        { timeout: 30000 },
      )
      .toBe(true);

    await page.evaluate(() => {
      document.querySelector("video")?.dispatchEvent(new Event("pause"));
    });

    await expect
      .poll(() => diag.apiCalls.filter((c) => c.includes("/me/progress/")).length, { timeout: 30000 })
      .toBeGreaterThan(0);
    expect(diag.apiCalls.filter((c) => c.includes("/me/progress/")).join("\n")).toContain("200");
  });

  test("the orders page lists a paid order", async ({ page, diag }) => {
    await page.goto(`/checkout?course=${plainSlug}`);
    await expect(page.getByText("قابل پرداخت")).toBeVisible();
    await page.getByRole("button", { name: "درگاه آزمایشی" }).click();
    await page.waitForURL(/localhost:8082/, { timeout: 20000 });
    await page.getByRole("link", { name: "پرداخت موفق" }).click();
    await page.waitForURL(/\/checkout\/result/, { timeout: 20000 });

    await page.goto("/dashboard/orders");

    await expect(page.getByRole("heading", { name: "سفارش‌های من" })).toBeVisible();
    await expect(page.getByText("پرداخت‌شده").first()).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("the profile page shows the account information", async ({ page, diag }) => {
    await page.goto("/dashboard/profile");

    await expect(page.getByRole("heading", { name: "دانشجو تست" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "اطلاعات حساب" })).toBeVisible();
    await expect(page.getByText("شماره موبایل")).toBeVisible();
    await expect(page.getByText("وضعیت حساب")).toBeVisible();
    await expect(page.getByText("فعال").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the sidebar reaches every learner section", async ({ page, diag }) => {
    await page.goto("/dashboard");

    await page.getByRole("link", { name: "سفارش‌های من" }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders$/);

    await page.getByRole("link", { name: "پروفایل" }).click();
    await expect(page).toHaveURL(/\/dashboard\/profile$/);

    await page.getByRole("link", { name: "دوره‌های من" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    expectNoClientErrors(diag);
  });

  test("a learner can change the password and sign in with the new one", async ({
    page,
    diag,
    playwright,
  }) => {
    const mobile = uniqueMobile();
    const api = await playwright.request.newContext({ baseURL: API_URL });
    const registered = await api.post("/api/v1/auth/register", {
      data: { full_name: "کاربر رمز تست", mobile, password: "OldPass2026" },
    });
    if (!registered.ok()) {
      test.skip(true, `the register endpoint refused the request: ${registered.status()}`);
    }
    await api.post("/api/v1/auth/otp/verify", {
      data: { mobile, code: readOtpFromLog(mobile), purpose: "verify" },
    });
    const cookies = (await api.storageState()).cookies;
    await api.dispose();

    await page.context().clearCookies();
    await page.context().addCookies(cookies);

    await page.goto("/dashboard/profile");
    await page.locator("#pw-current").fill("OldPass2026");
    await page.locator("#pw-next").fill("NewPass2026");
    await page.getByRole("button", { name: "ذخیره رمز تازه" }).click();

    await expect(page.getByText("رمز عبور با موفقیت تغییر کرد")).toBeVisible();

    // the old password no longer works, the new one does
    await page.goto("/login");
    await page.getByLabel("شماره موبایل").fill(mobile);
    await page.getByLabel("رمز عبور").fill("OldPass2026");
    await page.locator("form").getByRole("button", { name: "ورود", exact: true }).click();
    await expect(page.locator('[role="alert"], [role="status"]').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("رمز عبور").fill("NewPass2026");
    await page.locator("form").getByRole("button", { name: "ورود", exact: true }).click();
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "کاربر رمز تست" })).toBeVisible();

    expectNoClientErrors(diag);
  });
});
