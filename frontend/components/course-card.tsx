import Link from "next/link";
import { StarIcon } from "lucide-react";
import { LEVEL_FA, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { fa, faPercent } from "@/lib/utils";

/* No course images exist yet (R-23): the cover is an honest, designed
   placeholder tinted with the brand primary and the course initials.
   «هزاران آموزش» card anatomy: cover, level chip, title, rating, price row. */
export function CourseCard({ course }: { course: CourseSummary }) {
  const hasDiscount = course.compare_at_price_rial != null && course.compare_at_price_rial > course.price_rial;
  const offPct = hasDiscount
    ? Math.round((1 - course.price_rial / (course.compare_at_price_rial as number)) * 100)
    : 0;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-surface border border-line bg-card transition-[box-shadow,border-color,transform] duration-(--motion) ease-motion hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raise">
      <Link
        href={`/courses/${encodeURIComponent(course.slug)}`}
        className="flex h-full flex-col"
        aria-label={course.title}
      >
        <div className="relative flex aspect-video items-center justify-center bg-primary-tint">
          <span
            aria-hidden
            className="font-display text-5xl font-semibold text-primary/45 transition-transform duration-(--motion-slow) ease-motion group-hover:scale-105"
          >
            {course.title.slice(0, 2)}
          </span>
          {hasDiscount && (
            <span className="absolute top-3 start-3 rounded-tag bg-destructive px-2 py-1 text-xs font-medium text-white">
              {faPercent(offPct)} تخفیف
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <span className="w-fit rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
            {LEVEL_FA[course.level]}
          </span>
          <h3 className="line-clamp-2 text-[15px] font-medium leading-7 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{course.summary}</p>
          {course.rating_count > 0 && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <StarIcon className="size-3.5 fill-warning text-warning" strokeWidth={2} aria-hidden />
              <span className="font-medium text-foreground">{fa((course.rating_avg ?? 0).toFixed(1))}</span>
              از {fa(course.rating_count)} نظر
            </p>
          )}
          <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-border-variant pt-3.5">
            <span className="text-[15px] font-semibold text-foreground">
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
    </article>
  );
}
