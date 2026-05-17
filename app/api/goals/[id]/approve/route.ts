import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "MANAGER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrisma();

  const params = await context.params;
  const id = params.id;

  const body = await req.json();
  const { action, comment } = body;

  if (action === "APPROVE") {
    const goal = await prisma.goal.update({
      where: { id },
      data: { status: "APPROVED", lockedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        goalId: id,
        userId: session.user.id,
        action: "GOAL_APPROVED",
      },
    });

    return Response.json({ goal });
  }

  if (action === "REWORK") {
    const goal = await prisma.goal.update({
      where: { id },
      data: { status: "REWORK_REQUESTED" },
    });

    await prisma.auditLog.create({
      data: {
        goalId: id,
        userId: session.user.id,
        action: "REWORK_REQUESTED",
        details: comment,
      },
    });

    return Response.json({ goal });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}