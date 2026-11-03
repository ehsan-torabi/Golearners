import { COURSE_SLUG, expect, expectNoClientErrors, test } from "../lib/helpers";

test.describe("course statistics", () => {
  test.use({ sessionRole: "admin" });

  test("the statistics tab lists every course with its numbers", async ({ page, diag }) => {
    await page.goto("/admin/courses");
    await page.getByRole("tab", { name: "آمار" }).click();

    await expect(page.getByRole("heading", { name: "گزارش عملکرد دوره‌ها" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "دانشجو" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "درآمد" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "تماشا" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "امتیاز" })).toBeVisible();

    // the seeded course is in the table
    await expect(page.getByRole("row").filter({ hasText: "آموزش Go از صفر" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the search narrows the table to one course", async ({ page, diag }) => {
    await page.goto("/admin/courses");
    await page.getByRole("tab", { name: "آمار" }).click();

    const search = page.getByPlaceholder("عنوان یا نامک دوره");
    await search.fill(COURSE_SLUG);
    await search.press("Enter");

    const rows = page.getByRole("row").filter({ hasText: COURSE_SLUG });
    await expect(rows).toHaveCount(1);

    expectNoClientErrors(diag);
  });

  test("a course opens its own statistics page", async ({ page, diag }) => {
    await page.goto("/admin/courses");
    await page.getByRole("tab", { name: "آمار" }).click();

    await page.getByRole("link", { name: "آموزش Go از صفر" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+\/stats$/);

    // the figures of the course, not placeholders
    await expect(page.getByText("درآمد کل")).toBeVisible();
    await expect(page.getByText("دانشجو", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("نرخ تکمیل")).toBeVisible();
    await expect(page.getByText("پیشرفت در درس‌ها")).toBeVisible();

    // the trend charts
    await expect(page.getByText("ثبت‌نام در ۶۰ روز اخیر")).toBeVisible();
    await expect(page.getByText("درآمد در ۶۰ روز اخیر")).toBeVisible();
    await expect(page.getByText("زمان تماشا در ۶۰ روز اخیر")).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the course page lists its learners and filters them", async ({ page, diag }) => {
    await page.goto("/admin/courses");
    await page.getByRole("tab", { name: "آمار" }).click();
    await page.getByRole("link", { name: "آموزش Go از صفر" }).click();
    await expect(page).toHaveURL(/\/stats$/);

    const learners = page.getByRole("region", { name: "دانشجوهای دوره" });
    await expect(learners.getByText("احسان ترابی فارسانی").first()).toBeVisible();

    // searchable by mobile
    const search = learners.getByPlaceholder("نام یا شماره دانشجو");
    await search.fill("09135095941");
    await search.press("Enter");
    await expect(learners.getByText("احسان ترابی فارسani".replace("ani", "انی")).first()).toBeVisible();
    await expect(learners.getByText("استاد")).toHaveCount(0);

    // and by standing
    await search.fill("");
    await search.press("Enter");
    await learners.getByRole("button", { name: "فیلتر" }).click();
    // the popover renders in a portal, so the select is not inside the region
    await page.getByLabel("فیلتر وضعیت دانشجو").selectOption("not_started");
    await page.keyboard.press("Escape");
    await expect(learners.getByText("شروع نشده").first()).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("the course editor links to the statistics page", async ({ page, diag }) => {
    await page.goto("/admin/courses");
    await page.getByRole("tab", { name: "آمار" }).click();

    await page.getByRole("row").filter({ hasText: "آموزش Go از صفر" }).getByRole("button", { name: "کنش‌های آموزش Go از صفر" }).click();
    await page.getByRole("menuitem", { name: "ویرایش" }).click();
    await expect(page.getByRole("heading", { name: "ویرایش دوره" })).toBeVisible();

    await page.getByRole("link", { name: "آمار دوره" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+\/stats$/);

    expectNoClientErrors(diag);
  });
});
