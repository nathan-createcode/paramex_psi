import React from "react";
import StatusBadge from "./status-badge";
import { formatCurrency, getDeadlineStatus } from "../../utils/project-utils";
import { ChevronUp, ChevronDown, MoreVertical, MoreHorizontal } from "lucide-react";

export default function ProjectTable({
  projects,
  onRowClick,
  onContextAction,
  sortConfig,
  onSort,
}) {
  // Komponen header yang dapat di-sort
  const SortableHeader = ({ children, sortKey, width }) => (
    <th className={`text-left py-4 px-6 text-sm font-semibold text-gray-700 ${width || ""}`}>
      <button
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        onClick={() => onSort && onSort(sortKey)}
      >
        {children}
        {sortConfig?.key === sortKey &&
          (sortConfig.direction === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          ))}
      </button>
    </th>
  );
  

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <tr>
              <SortableHeader sortKey="name" width="w-[200px]">Project Name</SortableHeader>
              <SortableHeader sortKey="client" width="w-[130px]">Client</SortableHeader>
              <SortableHeader sortKey="startDate" width="w-[130px]">Start Date</SortableHeader>
              <SortableHeader sortKey="deadline" width="w-[130px]">Deadline</SortableHeader>
              <SortableHeader sortKey="type" width="w-[200px]">Type</SortableHeader>
              <SortableHeader sortKey="payment" width="w-[120px]">Payment</SortableHeader>
              <SortableHeader sortKey="difficulty" width="w-[120px]">Difficulty</SortableHeader>
              <SortableHeader sortKey="status" width="w-[140px]">Status</SortableHeader>
              <SortableHeader className="text-left py-2 px-2 text-sm font-semibold text-gray-400" width="w-[20px]"></SortableHeader>

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              >

                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-gray-900">
                    {project.name}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-600">{project.client}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-600">
                    {project.startDate}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div
                    className={`text-sm ${
                      getDeadlineStatus(project.deadline, project.status)
                        .className
                    }`}
                  >
                    {project.deadline}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.type} type="project-type" />
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(project.payment)}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.difficulty} type="difficulty" />
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.status} />
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // agar tidak trigger onRowClick jika ada
                      onContextAction(project, { x: e.pageX, y: e.pageY });
                    }}
                    className="text-gray-400 hover:text-black rounded-full px-2 py-1 text-lg leading-none cursor-pointer"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
