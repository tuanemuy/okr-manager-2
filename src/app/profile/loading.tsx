import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header section */}
      <div className="flex items-center space-x-4 mb-8">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 border-b">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Form content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Form fields */}
          {["field-1", "field-2"].map((key) => (
            <div key={key} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}

          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
