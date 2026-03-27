// skeleton/CategorySkeleton.tsx
"use client";

import { Field, FieldGroup } from "@/components/ui/field";

interface CategorySkeletonProps {
  count?: number; // how many skeleton items to show
}

export default function CategorySkeleton({ count = 6 }: CategorySkeletonProps) {
  return (
    <FieldGroup className="flex-1 overflow-y-auto space-y-3 hide-scrollbar !gap-2 !p-0">
      {Array.from({ length: count }).map((_, idx) => (
        <Field key={idx} orientation="horizontal" className="flex items-center gap-2">
          {/* Skeleton checkbox */}
          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
          {/* Skeleton text */}
          <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
        </Field>
      ))}
    </FieldGroup>
  );
}