import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = await getPrisma();
  const goals = await prisma.goal.findMany({
    where: { cycleYear: new Date().getFullYear() },
    include: { owner: true, checkIns: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ goals });
}