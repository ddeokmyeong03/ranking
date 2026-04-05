import { LEVEL_LABELS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  className?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-gray-700 text-gray-300",
  2: "bg-blue-900/50 text-blue-300",
  3: "bg-green-900/50 text-green-300",
  4: "bg-yellow-900/50 text-yellow-300",
};

export default function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "text-xs font-bold px-2 py-0.5 rounded-lg",
        LEVEL_COLORS[level] ?? "bg-gray-700 text-gray-300",
        className
      )}
    >
      Lv.{level} {LEVEL_LABELS[level]}
    </span>
  );
}
