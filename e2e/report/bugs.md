# GoLearn — E2E bug report

Generated 2026-11-02T16:28:24.267Z · 184s · 65 passed · 0 failed · 2 skipped · 0 flaky (67 total)

Reproduce a single entry with `cd e2e && bunx playwright test <spec file>`.

## No failures

The suite passed. See the observation section for silent client-side errors.

## Observations — tests passed but the page logged errors

- **1×** Failed to load resource: the server responded with a status of 400 (Bad Request)
  - e.g. “a coupon is created and switched off”
- **37×** Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - e.g. “a new mobile registers, verifies the OTP and lands on the dashboard”, “registration rejects a password that is too short”, “login with a wrong password shows an error and stays on the login page”, “login with the correct password opens the learner dashboard”, “login with an SMS code opens the learner dashboard”
- **1×** Failed to load resource: the server responded with a status of 404 (Not Found)
  - e.g. “unknown course slug renders the not-found page”
