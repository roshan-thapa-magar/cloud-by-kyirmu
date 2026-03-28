'use client';

import React from "react";

interface ComboSkeletonProps {
  count?: number;
}

export const ComboSkeleton: React.FC<ComboSkeletonProps> = ({ count = 4 }) => {
  const SkeletonItem = () => (
    <div className="custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-54 md:h-72 space-y-2 border rounded-lg p-2 animate-pulse bg-gray-100 w-full">
      <div className="h-36 md:h-50 w-full bg-gray-300 rounded-lg" />
      <div className="h-4 w-3/4 bg-gray-300 rounded" />
      <div className="h-4 w-1/2 bg-gray-300 rounded" />
    </div>
  );

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonItem key={idx} />
      ))}
    </>
  );
};