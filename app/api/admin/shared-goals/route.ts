import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = await getPrisma();
  const body = await req.json();
  const { thrustArea, title, description, uomType, target, weightage, cycleYear, recipientIds, primaryOwnerId } = body;

  if (!primaryOwnerId) return Response.json({ error: "Primary owner is required" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      ownerId: primaryOwnerId,
      thrustArea,
      title,
      description,
      uomType,
      target: target ? Number(target) : null,
      weightage: Number(weightage),
      cycleYear: Number(cycleYear),
      isShared: true,
      status: "APPROVED",
      lockedAt: new Date(),
    },
  });

  const otherRecipients = (recipientIds as string[]).filter((id: string) => id !== primaryOwnerId);
  for (const recipientId of otherRecipients) {
    await prisma.sharedGoalRecipient.create({
      data: {
        goalId: goal.id,
        recipientId,
        weightage: Number(weightage),
      },
    });
  }

  return Response.json({ goal });
}
