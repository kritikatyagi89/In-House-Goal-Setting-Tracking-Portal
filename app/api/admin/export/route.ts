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
  });

  const report = goals.map(g => ({
    Employee: g.owner.name,
    Email: g.owner.email,
    ThrustArea: g.thrustArea,
    Title: g.title,
    UoM: g.uomType,
    Target: g.target ?? g.targetDate ?? "",
    Weightage: g.weightage,
    Status: g.status,
    CheckIns: g.checkIns.length,
    AvgScore: g.checkIns.length ? Math.round(g.checkIns.reduce((s, c) => s + (c.score ?? 0), 0) / g.checkIns.length) : "",
  }));

  return Response.json({ report });
}