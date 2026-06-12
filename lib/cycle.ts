export type CyclePeriod = "GOAL_SETTING" | "Q1" | "Q2" | "Q3" | "Q4_ANNUAL";

export function getCurrentPeriod(date: Date = new Date()): CyclePeriod | null {
  const month = date.getMonth();
  if (month === 4 || month === 5) return "GOAL_SETTING";
  if (month === 6) return "Q1";
  if (month === 9) return "Q2";
  if (month === 0) return "Q3";
  if (month === 2 || month === 3) return "Q4_ANNUAL";
  return null;
}

export function isGoalSettingOpen(date?: Date): boolean {
  return getCurrentPeriod(date) === "GOAL_SETTING";
}

export function isCheckinOpen(period: string, date?: Date): boolean {
  return getCurrentPeriod(date) === period;
}

export function formatPeriodLabel(period: CyclePeriod | null): string {
  if (period === "GOAL_SETTING") return "Goal Setting Window Open";
  if (period === "Q1") return "Current cycle: Q1 Check-in";
  if (period === "Q2") return "Current cycle: Q2 Check-in";
  if (period === "Q3") return "Current cycle: Q3 Check-in";
  if (period === "Q4_ANNUAL") return "Current cycle: Q4/Annual Check-in";
  return "Outside cycle window";
}
