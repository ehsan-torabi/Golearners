import { expect, expectNoClientErrors, test } from "../lib/helpers";

const PUBLIC_ROUTES = [
  "/",
  "/courses",
  "/courses/go-from-zero",
  "/blog",
  "/instructor",
  "/contact",
  "/login",
  "/register",
  "/checkout?course=go-from-zero",
  // no order id: the page must render its "cannot determine" state, not crash
  "/checkout/result",
];

/**
 * Crawls every route and fails on server errors, client-side exceptions or
 * broken pages — the cheapest way to catch a broken build early.
 */
test.describe("route smoke test", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} renders without errors`, async ({ page, diag }) => {
      const response = await page.goto(route);

      expect(response?.status(), `${route} returned a server error`).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      expectNoClientErrors(diag);
    });
  }

  test("the API health endpoint answers", async ({ request }) => {
    const res = await request.get("http://localhost:8080/healthz");
    expect(res.status()).toBe(200);
  });
});
