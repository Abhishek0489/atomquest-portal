import { cn } from "@/lib/utils";
import { REQUIRED_TOTAL_WEIGHTAGE } from "@/lib/goal-validation";

type WeightageBarProps = {
  total: number;
  max?: number;
};

export function WeightageBar({
  total,
  max = REQUIRED_TOTAL_WEIGHTAGE,
}: WeightageBarProps) {
  const percent = Math.min((total / max) * 100, 100);
  const isOver = total > max;
  const isExact = total === max;
  const isUnder = total < max;

  const barColor = isOver
    ? "bg-red-500"
    : isExact
      ? "bg-green-500"
      : "bg-amber-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#0F172A]">Total weightage</span>
        <span
          className={cn(
            "font-semibold",
            isOver && "text-red-600",
            isExact && "text-green-600",
            isUnder && "text-amber-600"
          )}
        >
          {total}% / {max}%
        </span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${isOver ? 100 : percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[#64748B]">
        {isOver && "Over 100% — reduce weightage before submitting."}
        {isExact && "Weightage is balanced at 100%."}
        {isUnder &&
          `${max - total}% remaining to reach 100% before you can submit all goals.`}
      </p>
    </div>
  );
}
