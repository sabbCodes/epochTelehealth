"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ClientLayoutContent = dynamic(() => import("./ClientLayoutContent"), {
  ssr: false,
  loading: () => null,
}) as React.ComponentType<{ children: ReactNode }>;

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ClientLayoutContent>{children}</ClientLayoutContent>;
}
