import { authOptions } from "@/lib/auth";
import { isCheckinOpen } from "@/lib/cycle";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();
  const body = await req.json();

  if (process.env.ALLOW_OUT_OF_WINDOW === "false" && !isCheckinOpen(body.period)) {
    return Response.json({ error: `Check-in window for ${body.period} is not currently open` }, { status: 403 });
  }

  const goal = await prisma.goal.findUnique({ where: { id: body.goalId } });
  if (!goal) return Response.json({ error: "Goal not found" }, { status: 404 });

  // Compute score
  let score = null;
  if (body.actual !== undefined && goal.target) {
    if (goal.uomType === "ZERO_BASED") score = body.actual === 0 ? 100 : 0;
    else if (goal.uomType === "MIN_NUMERIC") score = Math.min(100, (body.actual / goal.target) * 100);
    else if (goal.uomType === "MAX_NUMERIC") score = Math.min(100, (goal.target / body.actual) * 100);
  } else if (goal.uomType === "TIMELINE" && body.actualDate && goal.targetDate) {
    score = new Date(body.actualDate) <= new Date(goal.targetDate) ? 100 : 0;
  }

  const checkin = await prisma.checkIn.upsert({
    where: { goalId_period: { goalId: body.goalId, period: body.period } },
    update: {
      actual: body.actual,
      status: body.status,
      score,
      ...(body.actualDate ? { actualDate: new Date(body.actualDate) } : {}),
    },
    create: {
      goalId: body.goalId,
      employeeId: session.user.id,
      period: body.period,
      actual: body.actual,
      status: body.status,
      score,
      ...(body.actualDate ? { actualDate: new Date(body.actualDate) } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      goalId: body.goalId,
      userId: session.user.id,
      action: "CHECKIN_UPDATED",
      details: JSON.stringify({ period: body.period, actual: body.actual, status: body.status }),
    },
  });

  return Response.json({ checkin });
}