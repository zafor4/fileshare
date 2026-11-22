"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/vault");
  }, [router]);
  return (
    <main className="grid min-h-screen place-items-center text-muted">
      Opening vault…
    </main>
  );
}
