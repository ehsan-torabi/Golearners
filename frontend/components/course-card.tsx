import Link from "next/link";
import { Star } from "lucide-react";
import { LEVEL_FA, LEVEL_COLORS, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fa, faPercent } from "@/lib/utils";

/* No course images exist yet (R-23): the cover is an honest, designed
   placeholder block with the course initials. */
export function CourseCard({ course }: { course: CourseSummary }) {
  const hasDiscount = course.compare_at_price_rial != null && course.compare_at_price_rial > course.price_rial;
  const offPct = hasDiscount
    ? Math.round((1 - course.price_rial / (course.compare_at_price_rial as number)) * 100)
    : 0;
  return (
    <Card className="group overflow-hidden transition-[box-shadow] duration-150 hover:shadow-raise">
      <Link href={`/courses/${encodeURIComponent(course.slug)}`} className="block">
        <div className="flex aspect-video items-center justify-center bg-primary-tint">
          <span aria-hidden className="text-4xl font-semibold text-accent-strong">
            {course.title.slice(0, 2)}
          </span>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium leading-6 text-foreground transition-colors duration-150 group-hover:text-accent-strong">
              {course.title}
            </h3>
            <Badge tone={LEVEL_COLORS[course.level]}>{LEVEL_FA[course.level]}</Badge>
          </div>
          <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{course.summary}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course.rating_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-warning text-warning-text" strokeWidth={2} aria-hidden />
                {fa((course.rating_avg ?? 0).toFixed(1))} ({fa(course.rating_count)})
              </span>
            )}
            {hasDiscount && <Badge tone="destructive">{faPercent(offPct)} تخفیف</Badge>}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-foreground">
              {course.price_rial === 0 ? "رایگان" : formatTomanFromRial(course.price_rial)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatTomanFromRial(course.compare_at_price_rial as number)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
