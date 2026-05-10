import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { Toaster } from "@/components/ui/toaster";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Epoch telehealth – Healthcare Without Borders",
  description:
    "Connect with world-class doctors from anywhere. Secure your medical records on blockchain.",
  metadataBase: new URL("https://www.epochtelehealth.com"),
  openGraph: {
    title: "Epoch telehealth – Healthcare Without Borders",
    description:
      "Connect with world-class doctors from anywhere. Secure your medical records on blockchain.",
    url: "https://www.epochtelehealth.com",
    siteName: "Epoch telehealth",
    images: [
      {
        url: "/epochOgp.jpg",
        width: 1200,
        height: 630,
        alt: "Epoch telehealth – Healthcare Without Borders",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Epoch telehealth – Healthcare Without Borders",
    description:
      "Connect with world-class doctors from anywhere. Secure your medical records on blockchain.",
    images: ["/epochOgp.jpg"],
    site: "@epochtelehealth",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
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
