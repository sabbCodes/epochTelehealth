"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const W3sContext = createContext<W3SSdk | null>(null);

export const W3sProvider = ({ children }: { children: React.ReactNode }) => {
  const sdkRef = useRef<W3SSdk | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize SDK on client only to avoid SSR window access
  useEffect(() => {
    if (sdkRef.current) {
      setReady(true);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
      if (!appId) {
        console.warn("W3sProvider: NEXT_PUBLIC_CIRCLE_APP_ID is not set");
      }
      const sdk = new W3SSdk();
      sdk.setAppSettings({ appId: appId as string });
      sdkRef.current = sdk;
      setReady(true);
    } catch (e) {
      console.error("Failed to initialize W3SSdk:", e);
    }
  }, []);

  // Avoid rendering children until SDK is ready to prevent consumers from throwing
  if (!ready) return null;

  return <W3sContext.Provider value={sdkRef.current}>{children}</W3sContext.Provider>;
};

export const useW3s = () => {
  const ctx = useContext(W3sContext);
  if (!ctx) throw new Error("useW3s must be used within a W3sProvider");
  return ctx;
};
