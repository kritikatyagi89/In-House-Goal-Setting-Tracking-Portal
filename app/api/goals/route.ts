import { authOptions } from "@/lib/auth";
import { isGoalSettingOpen } from "@/lib/cycle";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();
  const cycleYear = new Date().getFullYear();

  const ownedGoals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, cycleYear },
    orderBy: { createdAt: "asc" },
  });

  const sharedRecipients = await prisma.sharedGoalRecipient.findMany({
    where: { recipientId: session.user.id, goal: { cycleYear } },
    include: { goal: { include: { checkIns: true } } },
  });

  const sharedGoals = sharedRecipients.map((r) => ({
    ...r.goal,
    sharedRecipientView: true,
    recipientWeightage: r.weightage,
  }));

  const goals = [...ownedGoals, ...sharedGoals];

  return Response.json({ goals });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.ALLOW_OUT_OF_WINDOW === "false" && !isGoalSettingOpen()) {
    return Response.json({ error: "Goal setting window is closed" }, { status: 403 });
  }

  const prisma = await getPrisma();
  const body = await req.json();

  const existingGoals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, cycleYear: body.cycleYear },
  });

  if (existingGoals.length >= 8)
    return Response.json({ error: "Maximum 8 goals allowed" }, { status: 400 });

  if (Number(body.weightage) < 10)
    return Response.json({ error: "Minimum weightage is 10%" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      ownerId: session.user.id,
      thrustArea: body.thrustArea,
      title: body.title,
      description: body.description,
      uomType: body.uomType,
      target: body.target ? Number(body.target) : null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      weightage: Number(body.weightage),
      cycleYear: body.cycleYear,
      status: "DRAFT",
    },
  });

  await prisma.auditLog.create({
    data: {
      goalId: goal.id,
      userId: session.user.id,
      action: "GOAL_CREATED",
    },
  });

  return Response.json({ goal });
}