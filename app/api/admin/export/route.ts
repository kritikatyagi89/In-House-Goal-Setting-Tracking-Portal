import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

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

  const columns = ["Employee", "Email", "ThrustArea", "Title", "UoM", "Target", "Weightage", "Status", "CheckIns", "AvgScore"] as const;
  const csvString = [
    columns.join(","),
    ...report.map((row) => columns.map((col) => escapeCsvField(row[col])).join(",")),
  ].join("\n");

  return new Response(csvString, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="achievement-report.csv"',
    },
  });
}