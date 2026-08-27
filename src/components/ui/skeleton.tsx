import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-stone-200/80 dark:bg-stone-800", className)}
      aria-busy="true"
      {...props}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-stone-200/80 flex flex-col">
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardContent className="p-4 flex-grow space-y-3">
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1.5 pt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12 px-4 sm:px-6 lg:px-8" aria-busy="true">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-stone-200/80">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Menu */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="w-full h-32 rounded-md" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Card className="border-stone-200/80">
            <CardContent className="p-0 divide-y divide-stone-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-12 h-12 rounded-md shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-stone-200/80">
                <CardContent className="p-6 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-7 w-12" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 space-y-8 pb-20" aria-busy="true">
      {/* Back Link */}
      <Skeleton className="h-5 w-32" />

      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Skeleton className="w-full aspect-video md:aspect-square rounded-2xl" />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4 space-y-3">
            <Skeleton className="h-6 w-32 mb-4" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </Card>
          <Skeleton className="h-28 rounded-xl" />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-7 w-36 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 flex gap-4">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MealPlanSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:px-6 lg:px-8 max-w-7xl space-y-6" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>

      {/* Week Navigator */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Desktop 7-Column Grid (21 slots) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div key={dayIndex} className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((mealIndex) => (
                <Skeleton key={mealIndex} className="h-[140px] w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
