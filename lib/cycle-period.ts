import type { CheckinPeriod, CyclePhase } from "@prisma/client";

const PERIOD_LABELS: Record<CheckinPeriod, string> = {
  Q1: "Q1 Check-in",
  Q2: "Q2 Check-in",
  Q3: "Q3 Check-in",
  Q4_ANNUAL: "Q4 Annual Check-in",
};

export function phaseToCheckinPeriod(phase: CyclePhase): CheckinPeriod | null {
  switch (phase) {
    case "Q1_CHECKIN":
      return "Q1";
    case "Q2_CHECKIN":
      return "Q2";
    case "Q3_CHECKIN":
      return "Q3";
    case "Q4_ANNUAL":
      return "Q4_ANNUAL";
    case "GOAL_SETTING":
      return "Q1";
    default:
      return null;
  }
}

export function getPeriodLabel(period: CheckinPeriod): string {
  return PERIOD_LABELS[period];
}

export function isCheckinPhaseOpen(phase: CyclePhase): boolean {
  return (
    phase === "Q1_CHECKIN" ||
    phase === "Q2_CHECKIN" ||
    phase === "Q3_CHECKIN" ||
    phase === "Q4_ANNUAL" ||
    phase === "GOAL_SETTING"
  );
}
