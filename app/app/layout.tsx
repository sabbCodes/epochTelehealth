import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { Toaster } from "@/components/ui/toaster";
import ClientLayout from "./client-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "teleHealthSol - Healthcare Without Borders",
  description:
    "Connect with world-class doctors from anywhere. Secure your medical records on blockchain.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TopLoadingBar />
        <ThemeProvider defaultTheme="system">
          <ClientLayout>
            {children}
            <Toaster />
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
