import { expect, test } from "../lib/helpers";

/**
 * Runs on the mobile project (Pixel 7). RTL Persian layouts break in narrow
 * viewports, so the checks focus on the menu and on horizontal overflow.
 */
test.describe("mobile and RTL layout", () => {
  test("the mobile menu opens and reaches every public section", async ({ page, diag }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "باز کردن منو" }).click();
    const nav = page.getByRole("navigation", { name: "ناوبری موبایل" });
    await expect(nav.getByRole("link", { name: "دوره‌ها" })).toBeVisible();

    await nav.getByRole("link", { name: "وبلاگ" }).click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test("the document is RTL and the language is Persian", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  });

  for (const path of ["/", "/courses", "/courses/go-from-zero", "/blog", "/contact", "/login"]) {
    test(`the ${path} page fits the mobile viewport`, async ({ page, diag }) => {
      await page.goto(path);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }
});
