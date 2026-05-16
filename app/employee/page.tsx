import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeeDashboard from "./EmployeeDashboard";

export default async function EmployeePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "EMPLOYEE") redirect("/");

  return <EmployeeDashboard user={session.user} />;
}