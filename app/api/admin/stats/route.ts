import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = await getPrisma();
  const [employees, managers] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.user.count({ where: { role: "MANAGER" } }),
  ]);
  return Response.json({ employees, managers });
}