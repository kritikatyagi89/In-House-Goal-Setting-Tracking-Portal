import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();
  const { id } = await context.params;
  const body = await req.json();

  const recipient = await prisma.sharedGoalRecipient.findUnique({
    where: { goalId_recipientId: { goalId: id, recipientId: session.user.id } },
  });
  if (!recipient) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.sharedGoalRecipient.update({
    where: { id: recipient.id },
    data: { weightage: Number(body.weightage) },
  });

  return Response.json({ success: true });
}
