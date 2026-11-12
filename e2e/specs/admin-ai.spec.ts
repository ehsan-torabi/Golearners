import { expect } from "@playwright/test";
import { API_URL, authHeaders, expectNoClientErrors, sessionCookies, test } from "../lib/helpers";

test.describe("admin AI assistant", () => {
  test.use({ sessionRole: "admin" });

  // the mock provider returns a fixed title; that is how we locate the draft
  const mockTitle = "آموزش گام‌به‌گام گو برای برنامه‌نویسان";

  test("mock provider is configured, a draft is generated and approved", async ({
    page,
    diag,
    playwright,
  }) => {
    // --- settings: enable the mock provider --------------------------------
    const adminCookies = await sessionCookies(playwright, "admin");
    const api = await playwright.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: authHeaders(adminCookies),
    });

    const settings = await api.put("/api/v1/admin/ai/settings", {
      data: {
        enabled: true,
        provider: "mock",
        model: "mock",
        temperature: 0.5,
        max_tokens: 2000,
        persona: "",
      },
    });
    expect(settings.status()).toBe(200);

    const testRes = await api.post("/api/v1/admin/ai/settings/test");
    expect(testRes.status()).toBe(200);
    expect((await testRes.json()).data.ok).toBe(true);
    await api.dispose();

    // --- UI: hub → generate blog post -------------------------------------
    await page.goto("/admin/ai");
    await expect(page.getByRole("heading", { name: "دستیار هوشمند" })).toBeVisible();

    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      consoleMessages.push(`PAGE ERROR: ${err.message}`);
    });

    await page.getByRole("tab", { name: "تولید جدید" }).click();
    await page
      .getByLabel("دستور به دستیار")
      .fill("موضوع نوشته: شروع زبان گو؛ متن را روان‌تر بنویس.");
    await page.getByRole("button", { name: /تولید «نوشتهٔ وبلاگ»/ }).click();

    // the new draft lands as pending
    const pendingRow = page
      .getByRole("row")
      .filter({ hasText: /در انتظار تصمیم/ })
      .first();
    try {
      await expect(pendingRow).toBeVisible({ timeout: 30000 });
    } catch {
      const errors = consoleMessages.join("\n");
      const bodyText = await page.locator("body").innerText();
      throw new Error(
        `pending draft did not appear. console errors: ${errors.slice(0, 500)} | body: ${bodyText.slice(0, 300)}`,
      );
    }

    // open it and approve → real post row appears on the posts list
    await pendingRow.getByRole("button", { name: /نمایش و تایید/ }).click();
    await page.getByRole("button", { name: /تایید و اعمال/ }).click();

    await page.goto("/admin/posts");
    const search = page.getByLabel("عنوان یا متن نوشته");
    await search.fill(mockTitle);
    await search.press("Enter");
    await expect(
      page.getByRole("row").filter({ hasText: mockTitle }).first()
    ).toBeVisible({ timeout: 30000 });

    expectNoClientErrors(diag);
  });

  test("a stats report renders the real numbers and the analysis", async ({ page, diag }) => {
    await page.goto("/admin/ai");

    await page.getByRole("tab", { name: "تولید جدید" }).click();
    await page
      .getByLabel("دستور به دستیار")
      .fill("روند ثبت‌نام و درآمد ماه گذشته را خلاصه کن.");
    await page.getByRole("button", { name: /تولید «گزارش آمار»/ }).click();

    // read-only report lands as ready — open the newest one from the worklist
    const reportRow = page.getByRole("row").filter({ hasText: "گزارش" }).first();
    await expect(reportRow).toBeVisible({ timeout: 30000 });
    await reportRow.getByRole("button", { name: /نمایش گزارش/ }).click();

    // the analysis renders (not a bare label)
    await expect(page.getByText("تحلیل دستیار").first()).toBeVisible();
    // and the source numbers the analysis was built on are visible
    await expect(page.getByText("داده‌های بررسی‌شده").first()).toBeVisible();
    await expect(
      page.locator("table").filter({ hasText: /enrollments|revenue_rial/ }).first()
    ).toBeVisible();

    expectNoClientErrors(diag);
  });
});
