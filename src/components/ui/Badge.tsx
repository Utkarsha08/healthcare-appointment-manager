import React from "react";

export type BadgeVariant =
  | "HELD"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "LEAVE_CANCELLED"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export function Badge({ variant, className = "" }: BadgeProps) {
  const getBadgeStyle = (v: BadgeVariant) => {
    switch (v) {
      case "HELD":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "CANCELLED":
      case "LEAVE_CANCELLED":
        return "bg-red-100 text-red-800 border border-red-200";
      case "LOW":
        return "bg-green-50 text-green-700 border border-green-100";
      case "MEDIUM":
        return "bg-orange-50 text-orange-700 border border-orange-100";
      case "HIGH":
        return "bg-red-50 text-red-700 border border-red-100";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getLabel = (v: BadgeVariant) => {
    if (v === "LEAVE_CANCELLED") return "CANCELLED";
    return v;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeStyle(
        variant
      )} ${className}`}
    >
      {getLabel(variant)}
    </span>
  );
}
