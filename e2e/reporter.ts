import type { FullResult, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import fs from "node:fs";
import path from "node:path";
import { diagnosticsOf } from "./lib/helpers";

interface Bug {
  id: string;
  severity: "critical" | "major" | "minor";
  area: string;
  title: string;
  test: string;
  steps: string[];
  expected: string;
  actual: string;
  error: string;
  consoleErrors: string[];
  pageErrors: string[];
  serverErrors: string[];
  failedRequests: string[];
  screenshot?: string;
  trace?: string;
  suspect: string[];
}

interface Observation {
  area: string;
  title: string;
  test: string;
  consoleErrors: string[];
  serverErrors: string[];
}

/** Turns the run into an AI-actionable bug report (markdown + json). */
export default class BugReporter implements Reporter {
  private bugs: Bug[] = [];
  private observations: Observation[] = [];
  private started = Date.now();

  onBegin(_config: unknown, _suite: Suite): void {
    this.started = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const diag = diagnosticsOf(test.id);
    const area = areaOf(test);
    const testPath = `${relative(test.location.file)}:${test.location.line}`;

    if (result.status === "failed") {
      const error = result.error?.message ?? "unknown failure";
      this.bugs.push({
        id: `BUG-${String(this.bugs.length + 1).padStart(3, "0")}`,
        severity: severityOf(error, diag),
        area,
        title: test.title,
        test: `${testPath} › ${test.titlePath().join(" › ")}`,
        steps: (result.steps ?? []).map((s) => s.title),
        expected: expectedOf(error),
        actual: actualOf(error),
        error,
        consoleErrors: diag.consoleErrors,
        pageErrors: diag.pageErrors,
        serverErrors: diag.serverErrors,
        failedRequests: diag.failedRequests,
        screenshot: attachmentPath(result, "screenshot"),
        trace: attachmentPath(result, "trace"),
        suspect: suspectsOf(error, area),
      });
      return;
    }

    if (diag.consoleErrors.length || diag.pageErrors.length || diag.serverErrors.length) {
      this.observations.push({
        area,
        title: test.title,
        test: `${testPath} › ${test.titlePath().join(" › ")}`,
        consoleErrors: diag.consoleErrors,
        serverErrors: diag.serverErrors,
      });
    }
  }

  onEnd(result: FullResult): void {
    const outDir = path.join(process.cwd(), "report");
    fs.mkdirSync(outDir, { recursive: true });

    const summary = {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - this.started,
      status: result.status,
      total: result.total,
      passed: result.expected,
      failed: result.unexpected,
      skipped: result.skipped,
      flaky: result.flaky,
      bugs: this.bugs,
      observations: this.observations,
    };

    fs.writeFileSync(path.join(outDir, "bugs.json"), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(outDir, "bugs.md"), markdown(summary));
    console.log(`\n[e2e] bug report: ${path.join(outDir, "bugs.md")}`);
  }
}

function relative(file: string): string {
  return path.relative(process.cwd(), file) || file;
}

function areaOf(test: TestCase): string {
  const file = path.basename(test.location.file);
  const map: Record<string, string> = {
    "site.spec.ts": "public site",
    "auth.spec.ts": "authentication",
    "checkout.spec.ts": "checkout & payment",
    "learner.spec.ts": "learner dashboard",
    "admin.spec.ts": "admin console",
    "responsive.spec.ts": "responsive / RTL",
    "smoke.spec.ts": "route smoke test",
  };
  return map[file] ?? file;
}

function severityOf(error: string, diag: ReturnType<typeof diagnosticsOf>): Bug["severity"] {
  if (/Internal Server Error|status: 500|\b500\b/.test(error) || diag.serverErrors.length) return "critical";
  if (/Timeout|timed out/i.test(error)) return "major";
  if (diag.pageErrors.length) return "major";
  return "major";
}

function expectedOf(error: string): string {
  const m = error.match(/Expected(?::|\s)\s*(.+)/);
  if (m) return m[1].replace(/\n+/g, " ").slice(0, 300);
  return "the page to render the expected content and finish the flow without errors";
}

function actualOf(error: string): string {
  const m = error.match(/Received(?::|\s)\s*(.+)/);
  if (m) return m[1].replace(/\n+/g, " ").slice(0, 300);
  const first = error.split("\n").find((l) => l.trim().length > 0) ?? error;
  return first.slice(0, 300);
}

/** Points the fixer at the most likely file(s) for the failure. */
function suspectsOf(error: string, area: string): string[] {
  const out: string[] = [];
  const url = error.match(/http:\/\/localhost:\d+(\/[^\s"')]*)?/);
  if (url) {
    const route = url[1] ?? "";
    out.push(`route ${route} (frontend/app${route}/page.tsx or its client component)`);
  }
  const map: Record<string, string> = {
    "public site": "frontend/app/(site)/**",
    authentication: "frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go",
    "checkout & payment": "frontend/app/(site)/checkout/** + backend/internal/service/checkout/**",
    "learner dashboard": "frontend/app/(app)/dashboard/**",
    "admin console": "frontend/app/(app)/admin/** + frontend/components/admin/**",
    "responsive / RTL": "frontend/components/layout + globals.css",
    "route smoke test": "frontend/app/**",
  };
  out.push(map[area] ?? "frontend/app/**");
  return out;
}

function attachmentPath(result: TestResult, name: string): string | undefined {
  const att = result.attachments.find((a) => a.name === name);
  return att?.path ? relative(att.path) : undefined;
}

function markdown(s: {
  generatedAt: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  bugs: Bug[];
  observations: Observation[];
}): string {
  const lines: string[] = [];
  lines.push("# GoLearn — E2E bug report");
  lines.push("");
  lines.push(
    `Generated ${s.generatedAt} · ${Math.round(s.durationMs / 1000)}s · ` +
      `${s.passed} passed · ${s.failed} failed · ${s.skipped} skipped · ${s.flaky} flaky (${s.total} total)`,
  );
  lines.push("");
  lines.push("Every entry below is reproducible with `cd e2e && bunx playwright test <test file>`.");
  lines.push("");

  if (s.bugs.length === 0) {
    lines.push("## No failures");
    lines.push("");
    lines.push("The suite passed. See the observation section for silent client-side errors.");
    lines.push("");
  } else {
    lines.push("## Index");
    lines.push("");
    lines.push("| ID | Severity | Area | Title |");
    lines.push("|----|----------|------|-------|");
    for (const b of s.bugs) {
      lines.push(`| ${b.id} | ${b.severity} | ${b.area} | ${escape(b.title)} |`);
    }
    lines.push("");
    for (const b of s.bugs) {
      lines.push(`## ${b.id} · ${b.title}`);
      lines.push("");
      lines.push(`- **Severity:** ${b.severity}`);
      lines.push(`- **Area:** ${b.area}`);
      lines.push(`- **Test:** \`${b.test}\``);
      if (b.steps.length) {
        lines.push("- **Steps:**");
        for (const step of b.steps) lines.push(`  - ${step}`);
      }
      lines.push(`- **Expected:** ${b.expected}`);
      lines.push(`- **Actual:** ${b.actual}`);
      lines.push(`- **Suspect area:** ${b.suspect.map((s) => `\`${s}\``).join(", ")}`);
      lines.push("");
      lines.push("```");
      lines.push(b.error.split("\n").slice(0, 40).join("\n"));
      lines.push("```");
      if (b.consoleErrors.length) {
        lines.push("");
        lines.push("**Console errors**");
        lines.push("```");
        lines.push(b.consoleErrors.join("\n"));
        lines.push("```");
      }
      if (b.pageErrors.length) {
        lines.push("");
        lines.push("**Uncaught page errors**");
        lines.push("```");
        lines.push(b.pageErrors.join("\n"));
        lines.push("```");
      }
      if (b.serverErrors.length) {
        lines.push("");
        lines.push("**HTTP 5xx**");
        lines.push("```");
        lines.push(b.serverErrors.join("\n"));
        lines.push("```");
      }
      if (b.failedRequests.length) {
        lines.push("");
        lines.push("**Failed requests**");
        lines.push("```");
        lines.push(b.failedRequests.join("\n"));
        lines.push("```");
      }
      if (b.screenshot) {
        lines.push("");
        lines.push(`**Screenshot:** \`${b.screenshot}\``);
      }
      if (b.trace) {
        lines.push("");
        lines.push(`**Trace:** \`${b.trace}\` (open with \`bunx playwright show-trace ${b.trace}\`)`);
      }
      lines.push("");
    }
  }

  if (s.observations.length) {
    lines.push("## Observations — tests passed but the page logged errors");
    lines.push("");
    for (const o of s.observations) {
      lines.push(`- **${o.area} › ${o.title}** (\`${o.test}\`)`);
      for (const e of o.consoleErrors) lines.push(`  - console: ${e}`);
      for (const e of o.serverErrors) lines.push(`  - http: ${e}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function escape(text: string): string {
  return text.replace(/\|/g, "\\|");
}
