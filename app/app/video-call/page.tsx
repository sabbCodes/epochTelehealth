"use client";

import dynamic from "next/dynamic";

const VideoCallPageContent = dynamic(
  () => import("./VideoCallPageContent"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    ),
  }
) as React.ComponentType<{}>;

export default function VideoCallPage() {
  return <VideoCallPageContent />;
}
