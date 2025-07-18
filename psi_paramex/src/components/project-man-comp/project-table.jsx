import React from "react";
import StatusBadge from "./status-badge";
import { formatCurrency, getDeadlineStatus } from "../../utils/project-utils";
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";

export default function ProjectTable({
  projects,
  onContextAction,
  sortConfig,
  onSort,
}) {
  // Komponen header yang dapat di-sort
  const SortableHeader = ({ children, sortKey, className = "" }) => (
    <th className={`text-left py-3 px-3 text-sm font-semibold text-gray-700 ${className}`}>
      <button
        className="hover:text-blue-600 transition-colors w-full text-left flex items-center gap-1"
        onClick={() => onSort && onSort(sortKey)}
      >
        {children}
        {sortConfig?.key === sortKey &&
          (sortConfig.direction === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          ))}
      </button>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Single Table with Responsive Layout */}
      <div className="overflow-x-auto">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <SortableHeader sortKey="name" className="min-w-[180px]">Project Name</SortableHeader>
                <SortableHeader sortKey="client" className="min-w-[120px]">Client</SortableHeader>
                <SortableHeader sortKey="startDate" className="min-w-[100px]">Start Date</SortableHeader>
                <SortableHeader sortKey="deadline" className="min-w-[100px]">Deadline</SortableHeader>
                <SortableHeader sortKey="type" className="min-w-[120px]">Type</SortableHeader>
                <SortableHeader sortKey="payment" className="min-w-[120px]">Payment</SortableHeader>
                <SortableHeader sortKey="difficulty" className="min-w-[100px]">Difficulty</SortableHeader>
                <SortableHeader sortKey="status" className="min-w-[100px]">Status</SortableHeader>
                <th className="w-12 text-center py-3 px-2 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="py-3 px-3">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                      {project.name}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm text-gray-600 truncate max-w-[120px]">
                      {project.client}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {project.startDate}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div
                      className={`text-sm whitespace-nowrap ${
                        getDeadlineStatus(project.deadline, project.status)
                          .className
                      }`}
                    >
                      {project.deadline}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={project.type} type="project-type" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(project.payment)}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={project.difficulty} type="difficulty" />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onContextAction(project, { x: e.pageX, y: e.pageY });
                      }}
                      className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
