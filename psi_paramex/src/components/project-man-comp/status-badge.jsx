import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  const getStatusStyles = () => {
    if (type === 'project-type') {
      switch (status.toLowerCase()) {
        case 'website':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'app':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }

    switch (status.toLowerCase()) {
      case 'on-process':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on-plan':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status}
    </span>
  );
}
