import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "CUSTOMER") redirect("/store");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
