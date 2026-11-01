import { request, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { API_URL, COUPON_CODE, credentials, readOtpFromLog } from "./lib/helpers";

const STATE_DIR = path.join(process.cwd(), "report", "state");
const CREDENTIAL_FILE = path.join(STATE_DIR, "credentials.json");

/**
 * Prepares the fixtures every spec relies on:
 *   - a learner account (log in when it exists, otherwise register + verify)
 *   - the owner account
 *   - a coupon so the checkout spec can assert a discount
 */
export default async function globalSetup(): Promise<void> {
  fs.mkdirSync(STATE_DIR, { recursive: true });

  const creds = { ...credentials() };

  const learnerCtx = await request.newContext({ baseURL: API_URL });
  try {
    if (!(await login(learnerCtx, creds.learner.mobile, creds.learner.password))) {
      const mobile = `0919${String(Date.now()).slice(-8)}`;
      const password = "Learner2026!";
      const registered = await learnerCtx.post("/api/v1/auth/register", {
        data: { full_name: "دانشجو تست", mobile, password },
      });
      if (!registered.ok()) {
        throw new Error(
          `cannot prepare the learner account: register failed with ${registered.status()}. ` +
            `The register endpoint is rate limited to 10/hour per IP — clear the redis keys "rl:*" and retry.`,
        );
      }
      const verified = await learnerCtx.post("/api/v1/auth/otp/verify", {
        data: { mobile, code: readOtpFromLog(mobile), purpose: "verify" },
      });
      if (!verified.ok()) {
        throw new Error(`learner OTP verify failed: ${verified.status()} ${await verified.text()}`);
      }
      creds.learner = { mobile, password };
    }
  } finally {
    await learnerCtx.dispose();
  }

  const adminCtx = await request.newContext({ baseURL: API_URL });
  try {
    if (!(await login(adminCtx, creds.admin.mobile, creds.admin.password))) {
      throw new Error(
        `the owner account ${creds.admin.mobile} could not be logged in. ` +
          `Bootstrap it with: cd backend && go run ./cmd/bootstrap -mobile ${creds.admin.mobile} -password '<password>' -name 'استاد'`,
      );
    }
    await ensureCoupon(adminCtx);
  } finally {
    await adminCtx.dispose();
  }

  fs.writeFileSync(CREDENTIAL_FILE, JSON.stringify(creds, null, 2));
}

/** Logs in; returns false when the account exists but the mobile is unverified. */
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
