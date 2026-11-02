import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BotIcon,
  BookOpenIcon,
  BrainIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CameraIcon,
  CloudIcon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  Gamepad2Icon,
  GlobeIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  LanguagesIcon,
  MusicIcon,
  PaletteIcon,
  PenToolIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SquareTerminalIcon,
  WrenchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* A curated icon set for course topics: every glyph names a real subject
   family (R-04). The stored value is the lucide key; empty falls back to the
   category initials, so old data keeps rendering. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  code: CodeIcon,
  terminal: SquareTerminalIcon,
  database: DatabaseIcon,
  cpu: CpuIcon,
  web: GlobeIcon,
  mobile: SmartphoneIcon,
  cloud: CloudIcon,
  security: ShieldCheckIcon,
  ai: BotIcon,
  data: BarChart3Icon,
  design: PaletteIcon,
  graphics: PenToolIcon,
  language: LanguagesIcon,
  math: CalculatorIcon,
  business: BriefcaseIcon,
  media: CameraIcon,
  music: MusicIcon,
  health: HeartPulseIcon,
  science: FlaskConicalIcon,
  game: Gamepad2Icon,
  engineering: WrenchIcon,
  study: GraduationCapIcon,
  learning: BookOpenIcon,
  productivity: BrainIcon,
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryMark({
  icon,
  title,
  className,
}: {
  icon?: string | null;
  title: string;
  className?: string;
}) {
  const Icon = icon ? CATEGORY_ICONS[icon] : undefined;
  if (Icon) {
    return <Icon aria-hidden className={cn("size-6", className)} strokeWidth={1.8} />;
  }
  return (
    <span aria-hidden className={cn("font-display text-lg font-semibold", className)}>
      {title.slice(0, 2)}
    </span>
  );
}
