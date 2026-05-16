import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();
  const goals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, cycleYear: new Date().getFullYear(), status: "DRAFT" },
  });

  if (goals.length === 0)
    return Response.json({ error: "No draft goals to submit" }, { status: 400 });

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  if (totalWeight !== 100)
    return Response.json({ error: `Total weightage must be 100% (currently ${totalWeight}%)` }, { status: 400 });

  await prisma.goal.updateMany({
    where: { ownerId: session.user.id, cycleYear: new Date().getFullYear(), status: "DRAFT" },
    data: { status: "SUBMITTED" },
  });

  return Response.json({ success: true });
}