import { Skeleton } from "@/components/ui/skeleton";

export default function OKRsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* OKR cards */}
      <div className="space-y-6">
        {["okr-1", "okr-2", "okr-3", "okr-4"].map((key) => (
          <div key={key} className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-2 w-full" />
              </div>
            </div>

            <div className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {["kr-1", "kr-2", "kr-3"].map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-4 w-12 ml-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
