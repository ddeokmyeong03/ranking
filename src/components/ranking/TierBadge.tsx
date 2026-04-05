import { POWERLIFTING_TIER_LABELS, POWERLIFTING_TIER_EMOJIS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

const TIER_COLORS: Record<number, string> = {
  1: "text-gray-400",
  2: "text-blue-400",
  3: "text-purple-400",
  4: "text-orange-400",
  5: "text-yellow-400",
};

export default function TierBadge({ score, showLabel = true, className }: TierBadgeProps) {
  return (
    <span className={cn("flex items-center gap-1", TIER_COLORS[score], className)}>
      <span>{POWERLIFTING_TIER_EMOJIS[score]}</span>
      {showLabel && (
        <span className="text-xs font-bold">{POWERLIFTING_TIER_LABELS[score]}</span>
      )}
    </span>
  );
}
