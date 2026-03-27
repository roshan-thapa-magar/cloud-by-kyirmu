"use client";

export default function SkeletonBanner() {
  return (
    <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-md border-2 border-green-500 bg-gray-200 animate-pulse">
      {/* Optional shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 opacity-50" />
    </div>
  );
}