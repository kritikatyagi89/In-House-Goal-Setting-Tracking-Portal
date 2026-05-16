import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = await getPrisma();
  const logs = await prisma.auditLog.findMany({
    include: { user: true, goal: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ logs });
}