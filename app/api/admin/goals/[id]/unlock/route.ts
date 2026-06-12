import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrisma();
  const { id } = await context.params;

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return Response.json({ error: "Goal not found" }, { status: 404 });

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: { status: "SUBMITTED", lockedAt: null },
  });

  await prisma.auditLog.create({
    data: {
      goalId: id,
      userId: session.user.id,
      action: "GOAL_UNLOCKED",
    },
  });

  return Response.json({ goal: updatedGoal });
}
