"use client";

import { useEffect, useState } from "react";



import { getCurrentUser } from "@/lib/api";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import Footer from "./Footer";


type User = {
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
};

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };

    loadUser();
  }, []);
  

 return (
  <div className="min-h-screen bg-[#f6f8fb]">
   

    <Sidebar
      permissions={user?.permissions ?? []}
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      onToggle={() => setCollapsed((value) => !value)}
      onCloseMobile={() => setMobileOpen(false)}
    />

    <div
      className={`
        min-h-screen transition-all duration-300
        ${collapsed ? "lg:pl-[84px]" : "lg:pl-[270px]"}
      `}
    >
      <TopNav
        firstName={user?.firstName}
        lastName={user?.lastName}
        role={user?.role}
        onMenuClick={() => setMobileOpen(true)}
      />

      <div className="flex min-h-[calc(100vh-76px)] flex-col">
        <main className="flex-1">{children}</main>

        <Footer />
      </div>
    </div>
  </div>
);
}