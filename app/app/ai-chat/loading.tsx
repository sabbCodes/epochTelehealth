import { Loader2, Brain } from "lucide-react";

export default function AIChatLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Initializing AI Health Assistant...
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Setting up your personalized health chat experience
        </p>
      </div>
    </div>
  );
}
