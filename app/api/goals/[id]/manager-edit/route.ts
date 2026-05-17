import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function PATCH(
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

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(body.target !== undefined && {
        target: Number(body.target),
      }),
      ...(body.weightage !== undefined && {
        weightage: Number(body.weightage),
      }),
    },
  });

  await prisma.auditLog.create({
    data: {
      goalId: id,
      userId: session.user.id,
      action: "MANAGER_EDITED",
      details: JSON.stringify(body),
    },
  });

  return Response.json({ goal });
}