export async function GET() {
  const { createClient } = await import("@libsql/client");
  
  const url = "file:///C:/Users/kriti/OneDrive/Desktop/goal-tracking-portal/prisma/dev.db";
  
  try {
    const client = createClient({ url });
    const result = await client.execute("SELECT email, role FROM User LIMIT 3");
    return Response.json({ rows: result.rows });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}