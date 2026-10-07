import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SidebarNav from "@/components/SidebarNav";
import HeaderBar from "@/components/HeaderBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Navigation Sidebar */}
      <SidebarNav user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar user={user} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
