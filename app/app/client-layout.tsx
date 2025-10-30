"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { W3sProvider } from "@/providers/W3sProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash.startsWith("#access_token")
    ) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      router.replace(`/signin?${params.toString()}`);
    }
  }, [router]);
  return (
    <W3sProvider>
      <SolanaProvider>{children}</SolanaProvider>
    </W3sProvider>
  );
}
