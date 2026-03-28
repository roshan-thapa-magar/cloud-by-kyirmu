"use client";

import React from "react";

interface ComboSkeletonProps {
  count?: number;
}

export function ComboSkeleton({ count = 5 }: ComboSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex-shrink-0 w-[80%] sm:w-1/2 md:w-1/3 lg:w-[23%]"
        >
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image Skeleton */}
            <div className="relative w-full h-32 md:h-48 bg-gray-200 animate-pulse" />
            
            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
              {/* Title Skeleton */}
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              
              {/* Description Skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}