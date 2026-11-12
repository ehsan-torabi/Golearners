import Link from "next/link";
import { Card } from "@/components/ui/card";

export type CourseInstructor = {
  full_name: string;
  headline: string;
  /** public read path of the uploaded photo; empty when none is set */
  avatar_url?: string | null;
};

function initial(name: string): string {
  return name.trim().charAt(0) || "م";
}

/** the teacher block on a course page (US-B2): photo, name, headline and one
    link to the full profile (US-B3 requires the link from every course). */
export function InstructorCard({ instructor }: { instructor: CourseInstructor }) {
  const name = instructor.full_name?.trim() || "مدرس گوLearn";
  return (
    <Card className="flex flex-wrap items-center gap-5 p-6 sm:flex-nowrap">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-card bg-primary-tint shadow-raise sm:size-20">
        {instructor.avatar_url ? (
          <img
            src={instructor.avatar_url}
            alt={`تصویر ${name}`}
            className="size-full object-cover"
            width={80}
            height={80}
          />
        ) : (
          <span
            aria-hidden
            className="flex size-full items-center justify-center font-display text-2xl font-semibold text-primary/45"
          >
            {initial(name)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-lg text-foreground">{name}</p>
        {instructor.headline && (
          <p className="mt-1 text-sm leading-7 text-muted-foreground">{instructor.headline}</p>
        )}
        <Link
          href="/instructor"
          className="mt-3 inline-flex h-10 items-center rounded-control border border-line bg-card px-4 text-sm font-medium text-foreground transition-colors duration-(--motion) ease-motion hover:bg-muted"
        >
          بیشتر دربارهٔ مدرس
        </Link>
      </div>
    </Card>
  );
}
