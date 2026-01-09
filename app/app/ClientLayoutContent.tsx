"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { WherebyProvider } from "@whereby.com/browser-sdk/react";
import { PhantomProvider, darkTheme, lightTheme } from "@phantom/react-sdk";
import { AddressType } from "@phantom/browser-sdk";

export default function ClientLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [theme, setTheme] = useState(lightTheme);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.hash.startsWith("#access_token")) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      router.replace(`/signin?${params.toString()}`);
    }

    const userPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(userPrefersDark ? darkTheme : lightTheme);

    setRedirectUrl(
      `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`
    );
  }, [router]);

  return (
    <PhantomProvider
      config={{
        providers: ["google", "apple", "injected"],
        appId: process.env.NEXT_PUBLIC_PHANTOM_APP_ID,
        addressTypes: [AddressType.solana],
        authOptions: {
          redirectUrl: redirectUrl ?? "",
        },
      }}
      theme={theme}
      appIcon="/telehealthlogo.svg"
      appName="epochTeleHealth"
    >
      <SolanaProvider>
        <WherebyProvider>{children}</WherebyProvider>
      </SolanaProvider>
    </PhantomProvider>
  );
}
