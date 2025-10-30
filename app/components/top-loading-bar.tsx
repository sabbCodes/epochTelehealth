"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function TopLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const pathname = usePathname();
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset state for new navigation
    setIsLoading(true);
    setProgress(0);
    setIsStuck(false);
    progressRef.current = 0;

    // Clear any existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start progress simulation
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        progressRef.current = Math.min(newProgress, 90);
        return progressRef.current;
      });
    }, 100);

    // Complete loading after a reasonable delay
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  // Handle network issues by detecting if progress gets stuck
  useEffect(() => {
    if (isLoading && progress > 0) {
      const stuckTimeout = setTimeout(() => {
        if (progress < 90 && progressRef.current === progress) {
          setIsStuck(true);
        }
      }, 3000);

      return () => clearTimeout(stuckTimeout);
    }
  }, [isLoading, progress]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          className={`fixed top-0 left-0 z-[9999] h-1 ${
            isStuck ? "bg-red-500" : "bg-blue-600"
          } rounded-r-full`}
          style={{
            width: `${progress}%`,
            transition: "width 0.3s ease-out",
          }}
        />
      )}
    </AnimatePresence>
  );
}
