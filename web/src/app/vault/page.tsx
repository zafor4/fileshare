"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";

export default function VaultPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/vault");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="shell grid min-h-[60vh] place-items-center text-muted">
          Checking vault access…
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Dashboard />
    </div>
  );
}
