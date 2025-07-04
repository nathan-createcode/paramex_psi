import React from "react";

export default function StatusBadge({ status, type = "status" }) {
  const getStatusStyles = () => {
    if (type === "difficulty") {
      switch (status.toLowerCase()) {
        case "low":
          return "bg-green-100 text-green-600 border-green-200";
        case "medium":
          return "bg-yellow-100 text-yellow-600 border-yellow-200";
        case "high":
          return "bg-red-100 text-red-600 border-red-200";
        default:
          return "bg-gray-100 text-gray-600 border-gray-200";
      }
    }

    if (type === "project-type") {
      switch (status.toLowerCase()) {
        case "website":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "foto":
          return "bg-green-100 text-green-800 border-green-200";
        case "video":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "game":
          return "bg-purple-100 text-purple-800 border-purple-200";
        case "mobile development":
          return "bg-red-100 text-red-800 border-red-200";
        case "app":
          return "bg-purple-100 text-purple-800 border-purple-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    switch (status.toLowerCase()) {
      case "on-process":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "on-plan":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // // For difficulty type, render without badge styling
  // if (type === "difficulty") {
  //   return (
  //     <span className={`text-sm font-medium ${getStatusStyles()}`}>
  //       {status}
  //     </span>
  //   );
  // }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
}
