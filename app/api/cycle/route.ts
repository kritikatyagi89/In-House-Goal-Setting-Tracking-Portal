import { getCurrentPeriod, isGoalSettingOpen } from "@/lib/cycle";

export async function GET() {
  return Response.json({
    currentPeriod: getCurrentPeriod(),
    goalSettingOpen: isGoalSettingOpen(),
  });
}
