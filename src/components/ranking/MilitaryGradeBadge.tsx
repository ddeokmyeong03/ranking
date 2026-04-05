import { MILITARY_GRADE_BG } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface MilitaryGradeBadgeProps {
  grade: string;
  className?: string;
}

export default function MilitaryGradeBadge({ grade, className }: MilitaryGradeBadgeProps) {
  return (
    <span
      className={cn(
        "text-xs font-bold px-2 py-0.5 rounded-lg",
        MILITARY_GRADE_BG[grade] ?? "bg-gray-700 text-gray-300",
        className
      )}
    >
      {grade}
    </span>
  );
}
