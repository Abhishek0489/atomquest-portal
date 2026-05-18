type ProgressScoreProps = {
  score: number | null | undefined;
};

export function ProgressScore({ score }: ProgressScoreProps) {
  if (score == null) {
    return (
      <span className="text-sm text-[#64748B]">Score: —</span>
    );
  }

  const color =
    score >= 80
      ? "text-[#16A34A]"
      : score >= 50
        ? "text-[#D97706]"
        : "text-[#DC2626]";

  return (
    <span className={`text-sm font-semibold ${color}`}>
      Score: {score.toFixed(1)}%
    </span>
  );
}
