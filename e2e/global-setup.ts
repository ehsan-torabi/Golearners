import { request, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { API_URL, COUPON_CODE, LEARNER, OWNER, readOtpFromLog } from "./lib/helpers";

/**
 * Prepares the fixtures every spec relies on:
 *   - a learner account (register + OTP verify, or log in when it already exists)
 *   - the owner account
 *   - a coupon so the checkout spec can assert a discount
 * Session cookies are written as Playwright storage states.
 */
export default async function globalSetup(): Promise<void> {
  const stateDir = path.join(process.cwd(), "report", "state");
  fs.mkdirSync(stateDir, { recursive: true });

  const learnerCtx = await request.newContext({ baseURL: API_URL });
  try {
    await ensureLearner(learnerCtx);
    await fs.promises.writeFile(
      path.join(stateDir, "learner.json"),
      JSON.stringify(await learnerCtx.storageState(), null, 2),
    );

    const adminCtx = await request.newContext({ baseURL: API_URL });
    try {
      await login(adminCtx, OWNER.mobile, OWNER.password);
      await fs.promises.writeFile(
        path.join(stateDir, "admin.json"),
        JSON.stringify(await adminCtx.storageState(), null, 2),
      );
      await ensureCoupon(adminCtx);
    } finally {
      await adminCtx.dispose();
    }
  } finally {
    await learnerCtx.dispose();
  }
}

async function ensureLearner(ctx: APIRequestContext): Promise<void> {
  const registered = await ctx.post("/api/v1/auth/register", {
    data: { full_name: "دانشجو تست", mobile: LEARNER.mobile, password: LEARNER.password },
  });

  if (registered.ok()) {
    const code = readOtpFromLog(LEARNER.mobile);
    const verified = await ctx.post("/api/v1/auth/otp/verify", {
      data: { mobile: LEARNER.mobile, code, purpose: "verify" },
    });
    if (!verified.ok()) {
      throw new Error(`learner OTP verify failed: ${verified.status()} ${await verified.text()}`);
    }
    return;
  }

  // Already registered (or throttled): log in instead.
  const logged = await login(ctx, LEARNER.mobile, LEARNER.password);
  if (logged) return;

  const body = await ctx.post("/api/v1/auth/otp/request", {
    data: { mobile: LEARNER.mobile, purpose: "verify" },
  });
  if (!body.ok()) {
    throw new Error(
      `cannot prepare the learner account: register=${registered.status()} login failed. ` +
        `The API rate limit may be exhausted — clear redis keys "rl:*" and retry.`,
    );
  }
  const code = readOtpFromLog(LEARNER.mobile);
  const verified = await ctx.post("/api/v1/auth/otp/verify", {
    data: { mobile: LEARNER.mobile, code, purpose: "verify" },
  });
  if (!verified.ok()) {
    throw new Error(`learner OTP verify failed: ${verified.status()} ${await verified.text()}`);
  }
}

async function login(ctx: APIRequestContext, mobile: string, password: string): Promise<boolean> {
  const res = await ctx.post("/api/v1/auth/login", { data: { mobile, password } });
  if (res.ok()) return true;
  const text = await res.text();
  if (text.includes("MOBILE_NOT_VERIFIED")) return false;
  throw new Error(`login failed for ${mobile}: ${res.status()} ${text}`);
}

async function ensureCoupon(ctx: APIRequestContext): Promise<void> {
  const csrf = (await ctx.storageState()).cookies.find((c) => c.name === "gl_csrf")?.value ?? "";
  const res = await ctx.post("/api/v1/admin/coupons", {
    headers: { "X-CSRF-Token": csrf },
    data: { code: COUPON_CODE, type: "percent", value: 10, per_user_limit: 5, status: "active" },
  });
  if (!res.ok() && !(await res.text()).includes("EXISTS")) {
    // A missing coupon only breaks the discount assertion — the run continues.
    console.warn(`[e2e] coupon ${COUPON_CODE} not ready: ${res.status()} ${await res.text()}`);
  }
}
