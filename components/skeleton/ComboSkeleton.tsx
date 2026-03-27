'use client';

import React from "react";

interface ComboSkeletonProps {
  count?: number;
}

export const ComboSkeleton: React.FC<ComboSkeletonProps> = ({ count = 4 }) => {
  const SkeletonItem = () => (
    <div className="flex-none w-64 sm:w-1/2 md:w-1/3 lg:w-72 h-72 flex flex-col space-y-2 border rounded-lg p-2 animate-pulse bg-gray-100">
      <div className="h-50 w-full bg-gray-300 rounded-lg" />
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