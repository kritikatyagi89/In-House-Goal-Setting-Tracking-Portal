import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ManagerDashboard from "./ManagerDashboard";

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "MANAGER") redirect("/");
  return <ManagerDashboard user={session.user} />;
}