import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "./session-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Goal Tracking Portal",
  description: "AtomQuest Hackathon - Goal Setting & Tracking",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}