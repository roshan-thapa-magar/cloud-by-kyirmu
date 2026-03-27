'use client'

import React from "react"

interface SkeletonProps {
  count?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ count = 6 }) => {
  const SkeletonItem = () => (
    <div className="flex-none w-20 flex flex-col items-center space-y-2">
      <div className="relative h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
      <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
    </div>
  )

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonItem key={idx} />
      ))}
    </>
  )
}