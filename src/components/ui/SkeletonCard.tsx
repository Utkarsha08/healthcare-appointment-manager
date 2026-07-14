import React from "react";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-100 rounded-xl bg-white shadow-sm animate-pulse ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-24"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
    </div>
  );
}
