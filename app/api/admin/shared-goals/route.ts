import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = await getPrisma();
  const body = await req.json();
  const { thrustArea, title, description, uomType, target, weightage, cycleYear, recipientIds } = body;

  const results = [];
  for (const recipientId of recipientIds) {
    const goal = await prisma.goal.create({
      data: {
        ownerId: recipientId,
        thrustArea, title, description, uomType,
        target: target ? Number(target) : null,
        weightage: Number(weightage),
        cycleYear: Number(cycleYear),
        isShared: true,
        status: "APPROVED",
        lockedAt: new Date(),
      },
    });
    results.push(goal);
  }
  return Response.json({ goals: results });
}