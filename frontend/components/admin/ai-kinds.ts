export const KINDS = [
  "blog_post",
  "course_copy",
  "seo",
  "stats_report",
  "freeform",
] as const;

export function kindLabel(kind: string) {
  switch (kind) {
    case "blog_post":
      return "نوشتهٔ وبلاگ";
    case "course_copy":
      return "محتوای دوره";
    case "seo":
      return "سئو";
    case "stats_report":
      return "گزارش آمار";
    case "freeform":
      return "درخواست آزاد";
    default:
      return kind;
  }
}

export function kindIcon(kind: string) {
  switch (kind) {
    case "blog_post":
      return "newspaper";
    case "course_copy":
      return "book-open";
    case "seo":
      return "search";
    case "stats_report":
      return "bar-chart-3";
    case "freeform":
      return "pen-tool";
    default:
      return "sparkles";
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "در انتظار تصمیم";
    case "applied":
      return "اعمال شده";
    case "rejected":
      return "رد شده";
    case "ready":
      return "گزارش آماده";
    case "failed":
      return "اعمال نشد";
    default:
      return status;
  }
}
