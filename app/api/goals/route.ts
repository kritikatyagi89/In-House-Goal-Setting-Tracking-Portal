import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();
  const goals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, cycleYear: new Date().getFullYear() },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ goals });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

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

  return Response.json({ goal });
}