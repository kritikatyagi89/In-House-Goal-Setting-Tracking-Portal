import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER")
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();
  const body = await req.json();

  const checkin = await prisma.checkIn.update({
    where: { goalId_period: { goalId: body.goalId, period: body.period } },
    data: { managerComment: body.comment, commentedAt: new Date() },
  });

  return Response.json({ checkin });
}