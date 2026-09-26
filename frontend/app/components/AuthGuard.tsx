"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await getCurrentUser();
        setChecking(false);
      } catch {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    checkAuthentication();
  }, [pathname, router]);

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