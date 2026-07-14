import React from "react";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-6 border border-gray-100 rounded-2xl bg-white shadow-sm animate-pulse ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-24"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
    </div>
  );
}
