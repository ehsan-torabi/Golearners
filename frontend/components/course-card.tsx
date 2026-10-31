import Link from "next/link";
import { Users, Star } from "lucide-react";
import { LEVEL_FA, LEVEL_COLORS, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { Badge, Card } from "@/components/ui/card";
import { fa, faPercent } from "@/lib/utils";

export function CourseCard({ course }: { course: CourseSummary }) {
  const hasDiscount = course.compare_at_price_rial != null && course.compare_at_price_rial > course.price_rial;
  const offPct = hasDiscount
    ? Math.round((1 - course.price_rial / (course.compare_at_price_rial as number)) * 100)
    : 0;
  return (
    <Card className="group overflow-hidden transition-transform duration-(--motion) ease-motion hover:-translate-y-0.5">
      <Link href={`/courses/${encodeURIComponent(course.slug)}`} className="block">
        <div className="flex aspect-video items-center justify-center bg-secondary/60">
          <span className="font-display text-2xl text-muted-foreground/60">{course.title.slice(0, 2)}</span>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base leading-7 text-foreground group-hover:text-primary">
              {course.title}
            </h3>
            <Badge className={LEVEL_COLORS[course.level]}>{LEVEL_FA[course.level]}</Badge>
          </div>
          <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{course.summary}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course.rating_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-warning text-warning" strokeWidth={2} />
                {fa((course.rating_avg ?? 0).toFixed(1))} ({fa(course.rating_count)})
              </span>
            )}
            {hasDiscount && <Badge className="border-destructive/40 text-destructive">{faPercent(offPct)} تخفیف</Badge>}
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground">
                {course.price_rial === 0 ? "رایگان" : formatTomanFromRial(course.price_rial)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatTomanFromRial(course.compare_at_price_rial as number)}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
