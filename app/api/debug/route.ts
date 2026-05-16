import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = await getPrisma();
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}