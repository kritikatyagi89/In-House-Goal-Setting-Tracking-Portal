import { authOptions } from "@/lib/auth";
import { isGoalSettingOpen } from "@/lib/cycle";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.ALLOW_OUT_OF_WINDOW === "false" && !isGoalSettingOpen()) {
    return Response.json({ error: "Goal setting window is closed" }, { status: 403 });
  }

  const prisma = await getPrisma();
  const goals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, cycleYear: new Date().getFullYear(), status: "DRAFT" },
  });

  if (goals.length === 0)
    return Response.json({ error: "No draft goals to submit" }, { status: 400 });

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  if (totalWeight !== 100)
    return Response.json({ error: `Total weightage must be 100% (currently ${totalWeight}%)` }, { status: 400 });

  await prisma.goal.updateMany({
    where: { ownerId: session.user.id, cycleYear: new Date().getFullYear(), status: "DRAFT" },
    data: { status: "SUBMITTED" },
  });

  for (const goal of goals) {
    await prisma.auditLog.create({
      data: {
        goalId: goal.id,
        userId: session.user.id,
        action: "GOAL_SUBMITTED",
      },
    });
  }

  return Response.json({ success: true });
}