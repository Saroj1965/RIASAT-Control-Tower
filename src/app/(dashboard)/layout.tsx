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
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <HeaderBar user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-6 w-full max-w-[1800px] mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
