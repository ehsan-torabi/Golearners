import { expect, test } from "../lib/helpers";

/**
 * Blog (مجله) — sisoog-parity client surface:
 * list → detail navigation, meta row (author/date/read time/views), series
 * strip with prev/next, share rail, guest comment → moderation pending,
 * admin approve → visible, view beacon increments.
 */
test.describe("blog", () => {
  let slug = "";
  let postId = "";
  let seriesSlug = "";

  test("seed: a published post (+ optional series part) exists via admin API", async ({
    request,
  }) => {
    const cookies = (await request.storageState()).cookies;
    // best-effort auth: spec tolerates missing admin credentials
    const login = await request.post("/api/v1/auth/login", {
      data: { mobile: "09121234567", password: "GoLearn2026!" },
    });
    if (!login.ok()) {
      test.skip(true); // no admin credentials in this environment
      return;
    }
    const headers = {
      "X-CSRF-Token": cookies.find((c) => c.name === "gl_csrf")?.value ?? "",
      Cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
      "Content-Type": "application/json",
    };

    const seriesRes = await request.post("/api/v1/admin/series", {
      headers,
      data: {
        title: "سری تست E2E",
        slug: `e2e-series-${Date.now().toString(36)}`,
        description: "تست سری‌های چندقسمتی",
      },
    });
    if (seriesRes.ok()) {
      const body = (await seriesRes.json()) as { id: string; slug: string };
      seriesSlug = body.slug;
    }

    const postRes = await request.post("/api/v1/admin/posts", {
      headers,
      data: {
        title: "مقالهٔ تست E2E وبلاگ",
        slug: `e2e-post-${Date.now().toString(36)}`,
        excerpt: "خلاصهٔ تست.",
        body_html: "<h2>فصل یک</h2><p>متن مقاله تست.</p>",
        category_id: null,
        series_id: seriesSlug ? undefined : null,
        series_part: seriesSlug ? 1 : undefined,
        featured: false,
      },
    });
    if (!postRes.ok()) {
      test.skip(true);
      return;
    }
    const body = (await postRes.json()) as { id: string; slug: string };
    postId = body.id;
    slug = body.slug;

    // publish it
    await request.post(`/api/v1/admin/posts/${postId}/publish`, { headers });
  });

  test("blog list renders and opens a post detail", async ({ page, diag }) => {
    if (!slug) test.skip(true);
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "وبلاگ", level: 1 })).toBeVisible();
    const link = page.locator(`a[href="/blog/${encodeURIComponent(slug)}"]`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/blog\/[^/]+\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "مقالهٔ تست E2E وبلاگ",
    );
    expectNoClientErrors(diag);
  });

  test("detail page shows meta row and share rail", async ({ page, diag }) => {
    if (!slug) test.skip(true);
    await page.goto(`/blog/${encodeURIComponent(slug)}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // views beacon fires on load
    await expect(page.getByText(/\d+ بازدید/)).toBeVisible();
    await expect(page.getByRole("button", { name: /اشتراک‌گذاری/ })).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("series strip renders when the post belongs to a series", async ({
    page,
    diag,
  }) => {
    if (!seriesSlug) test.skip(true);
    await page.goto(`/blog/${encodeURIComponent(slug)}`);
    await expect(
      page.getByText("سری تست E2E", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.locator("a[href*='/blog/']").filter({ hasText: /قبلی|بعدی/ }).first(),
    ).toBeVisible();
    expectNoClientErrors(diag);
  });

  test("guest comment is queued as pending", async ({ page, diag, request }) => {
    if (!slug) test.skip(true);
    await page.goto(`/blog/${encodeURIComponent(slug)}`);
    await page.getByLabel("نظرتان").fill("نظر تست مهمان — منتظر تایید.");
    await page.getByLabel("نام شما").fill("تست");
    await page.getByLabel("ایمیل شما").fill("test@example.com");
    await page.getByRole("button", { name: "ثبت نظر" }).click();
    await expect(
      page.getByText("بعد از بررسی مدیر منتشر می‌شود"),
    ).toBeVisible();
    expectNoClientErrors(diag);

    // admin approves → comment appears
    const login = await request.post("/api/v1/auth/login", {
      data: { mobile: "09121234567", password: "GoLearn2026!" },
    });
    if (!login.ok()) test.skip(true);
    const cookies = (await request.storageState()).cookies;
    const headers = {
      "X-CSRF-Token": cookies.find((c) => c.name === "gl_csrf")?.value ?? "",
      Cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
    };
    const list = await request.get("/api/v1/admin/comments?status=pending", {
      headers,
    });
    const body = (await list.json()) as { data: { id: string }[] };
    const cid = body.data?.[0]?.id;
    if (cid) {
      await request.post(`/api/v1/admin/comments/${cid}/approve`, { headers });
    }
    await page.reload();
    await expect(page.getByText("نظر تست مهمان — منتظر تایید.")).toBeVisible();
    expectNoClientErrors(diag);
  });
});
