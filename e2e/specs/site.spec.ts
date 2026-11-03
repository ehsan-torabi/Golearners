import { expect, expectNoClientErrors, test } from "../lib/helpers";

test.describe("public site", () => {
  test("home page renders hero, course sections and FAQ", async ({ page, diag, request }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "برنامه‌نویسی را درست یاد بگیر" })).toBeVisible();
    await expect(page.getByRole("link", { name: "دیدن دوره‌ها" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "دوره‌های پربازدید" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "مسیر یادگیری" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "دوره‌ات را انتخاب کن" })).toBeVisible();

    // the FAQ block only renders when the site actually has questions
    const faqs = await request.get("http://localhost:8080/api/v1/faqs");
    const count = faqs.ok() ? ((await faqs.json()) as { data: unknown[] }).data?.length ?? 0 : 0;
    const faqHeading = page.getByRole("heading", { name: "سوال‌های پرتکرار" });
    if (count > 0) await expect(faqHeading).toBeVisible();
    else await expect(faqHeading).toHaveCount(0);

    expectNoClientErrors(diag);
  });

  test("courses list shows cards that lead to a detail page", async ({ page, diag }) => {
    await page.goto("/courses");

    await expect(page.getByRole("heading", { name: "دوره‌ها", level: 1 })).toBeVisible();
    const card = page.locator('a[href^="/courses/"]').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/courses\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("course search finds the known course", async ({ page, diag }) => {
    await page.goto("/courses?q=Go");
    await page.getByRole("button", { name: "اعمال فیلتر" }).click();
    await page.waitForURL(/q=Go/);

    await expect(
      page.getByRole("link", { name: /آموزش Go از صفر/ }).first(),
    ).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("course detail shows curriculum and a guest purchase CTA", async ({ page, diag }) => {
    await page.goto("/courses/go-from-zero");

    await expect(page.getByRole("heading", { name: "آموزش Go از صفر" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "سرفصل‌ها" })).toBeVisible();
    // guests add to the cart freely; sign-in is asked at pay time
    await expect(page.getByRole("button", { name: "افزودن به سبد خرید" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("unknown course slug renders the not-found page", async ({ page, diag }) => {
    const response = await page.goto("/courses/does-not-exist-e2e");
    expect(response?.status()).toBe(404);
    // the project renders its own 404 (site shell + Persian copy)
    await expect(page.getByText("این صفحه پیدا نشد")).toBeVisible();
    await expect(page.getByRole("link", { name: "بازگشت به خانه" })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("blog list renders posts or the empty state", async ({ page, diag }) => {
    await page.goto("/blog");

    await expect(page.getByRole("heading", { name: "وبلاگ", level: 1 })).toBeVisible();
    const empty = page.getByText("هنوز مقاله‌ای منتشر نشده است");
    const post = page.locator('a[href^="/blog/"]').first();
    await expect(empty.or(post)).toBeVisible();

    if (await post.isVisible()) {
      await post.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }

    expectNoClientErrors(diag);
  });

  test("instructor page renders the profile or its empty state", async ({ page, diag }) => {
    await page.goto("/instructor");

    await expect(page.getByRole("heading", { name: "درباره مدرس" })).toBeVisible();
    const empty = page.getByText("اطلاعات مدرس هنوز تکمیل نشده است");
    const headline = page.locator("main p").first();
    await expect(empty.or(headline)).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("contact form stores a message and confirms", async ({ page, diag }) => {
    await page.goto("/contact");

    await page.getByLabel("نام").fill("کاربر تست E2E");
    await page.getByLabel("موبایل یا ایمیل").fill("09121110099");
    await page.getByLabel("پیام").fill("این یک پیام تست خودکار از تست E2E است.");

    const contactResponse = page
      .waitForResponse((r) => r.url().includes("/api/v1/contact"), { timeout: 20000 })
      .catch(() => null);
    await page.getByRole("button", { name: "ارسال پیام" }).click();
    const response = await contactResponse;

    if (response && response.status() === 429) {
      test.skip(true, "the contact endpoint is rate limited (5/hour per IP)");
    }

    await expect(page.getByText("پیام شما ثبت شد؛ در اولین فرصت پاسخ می‌دهیم.")).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("contact form rejects a too short message", async ({ page, diag }) => {
    await page.goto("/contact");

    await page.getByLabel("نام").fill("کاربر تست E2E");
    await page.getByLabel("موبایل یا ایمیل").fill("09121110098");
    await page.getByLabel("پیام").fill("کوتاه");
    await page.getByRole("button", { name: "ارسال پیام" }).click();

    await expect(page.getByText("پیام شما ثبت شد؛ در اولین فرصت پاسخ می‌دهیم.")).toBeHidden();
    expectNoClientErrors(diag);
  });

  test("navbar reaches every public section", async ({ page, diag }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "ناوبری اصلی" });

    for (const [label, path] of [
      ["دوره‌ها", "/courses"],
      ["وبلاگ", "/blog"],
      ["درباره مدرس", "/instructor"],
      ["تماس", "/contact"],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }

    expectNoClientErrors(diag);
  });

  test("footer links and support address are present", async ({ page, diag }) => {
    await page.goto("/");
    const footer = page.getByRole("navigation", { name: "ناوبری پابرگ" });

    await expect(footer.getByRole("link", { name: "دوره‌ها" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "وبلاگ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "support@golearn.ir" })).toBeVisible();

    expectNoClientErrors(diag);
  });

  test("theme toggle switches the colour scheme", async ({ page, diag }) => {
    await page.goto("/");
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");

    await page.getByRole("button", { name: "تغییر تم روشن و تاریک" }).click();
    await expect(html).not.toHaveAttribute("data-theme", before ?? "");

    expectNoClientErrors(diag);
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      const res = await request.get(path);
      expect(res.status(), `${path} should be served`).toBe(200);
    }
  });
});
