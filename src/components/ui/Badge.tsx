import { DutyType } from "@prisma/client";
import { dutyTypeLabel, dutyTypeColor } from "@/lib/utils";

export function DutyTypeBadge({ type }: { type: DutyType }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dutyTypeColor(type)}`}
    >
      {dutyTypeLabel(type)}
    </span>
  );
}
