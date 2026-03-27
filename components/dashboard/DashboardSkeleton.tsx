import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const SkeletonCard = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-12 w-12 rounded-lg mb-4" />
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[220px]" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <Skeleton className="h-8 w-48 mt-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}