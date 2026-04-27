// src/components/customer/ProductCardSkeleton.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col h-full">
      {/* Image Skeleton */}
      <Skeleton className="aspect-square w-full rounded-b-none" />
      
      {/* Content Skeleton */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
        </div>
        
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
        
        <div className="flex justify-between items-center pt-2">
            <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
