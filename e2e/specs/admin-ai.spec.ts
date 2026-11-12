import { expect, test } from "@playwright/test";
import { API_URL, expectNoClientErrors, sessionCookies } from "../lib/helpers";

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
    const csrf = adminCookies.find((c) => c.name === "gl_csrf")?.value ?? "";
    const api = await playwright.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { "X-CSRF-Token": csrf },
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

    await page.getByRole("button", { name: /تولید «نوشتهٔ وبلاگ»/ }).click();

    // the new draft lands as pending
    const pendingRow = page
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", { name: "در انتظار تصمیم" }),
      })
      .first();
    await expect(pendingRow).toBeVisible({ timeout: 40000 });

    // open it and approve → applied → real post row appears
    await pendingRow.getByRole("button", { name: /نمایش و تایید/ }).click();
    await page.getByRole("button", { name: /تایید و اعمال/ }).click();
    await expect(
      page.getByRole("cell", { name: "اعمال شده" })
    ).toBeVisible({ timeout: 30000 });

    await page.goto("/admin/posts");
    const search = page.getByLabel("عنوان یا متن نوشته");
    await search.fill(mockTitle);
    await search.press("Enter");
    await expect(
      page.getByRole("row").filter({ hasText: mockTitle })
    ).toBeVisible({ timeout: 30000 });

    expectNoClientErrors(diag);
  });
});
