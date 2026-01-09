import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function DoctorProfileSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex items-start space-x-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-5 w-36" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-12 w-full" />

                <div className="pt-2">
                  <div className="flex items-center mb-2">
                    <Skeleton className="w-4 h-4 mr-2" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <div className="ml-6 space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-start">
                        <Skeleton className="w-2 h-2 mt-1.5 mr-2" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center">
                    <Skeleton className="w-4 h-4 mr-2" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-6" />

            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>

            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <Skeleton className="h-6 w-6 mr-2" />
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between font-bold">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>

                <Skeleton className="h-3 w-full mt-1" />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4">
                <div className="flex items-center mb-1">
                  <Skeleton className="w-4 h-4 mr-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>

              <Skeleton className="h-10 w-full mt-4 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorProfileSkeleton;
