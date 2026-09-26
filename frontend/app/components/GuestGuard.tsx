"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";

type GuestGuardProps = {
  children: React.ReactNode;
};

export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await getCurrentUser();
        router.replace("/dashboard");//user is authenticated, redirect to dashboard
      } catch {
        setChecking(false);
      }
    };

    checkAuthentication();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="text-sm text-slate-500">
          Checking authentication...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}