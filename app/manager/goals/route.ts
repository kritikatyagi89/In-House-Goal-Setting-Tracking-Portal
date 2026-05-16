import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = await getPrisma();

  const employees = await prisma.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goals: {
        where: { cycleYear: new Date().getFullYear() },
        include: { checkIns: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return Response.json({ employees });
}