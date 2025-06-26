import React from "react";
import StatusBadge from "./status-badge";
import { formatCurrency, getDeadlineStatus } from "../../utils/project-utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function ProjectTable({ projects, onRowClick, onContextAction, sortConfig, onSort }) {
  // Komponen header yang dapat di-sort
  const SortableHeader = ({ children, sortKey }) => (
    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
      <button
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        onClick={() => onSort && onSort(sortKey)}
      >
        {children}
        {sortConfig?.key === sortKey && (
          sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </button>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <tr>
              <SortableHeader sortKey="name">Project Name</SortableHeader>
              <SortableHeader sortKey="client">Client</SortableHeader>
              <SortableHeader sortKey="startDate">Start Date</SortableHeader>
              <SortableHeader sortKey="deadline">Deadline</SortableHeader>
              <SortableHeader sortKey="type">Type</SortableHeader>
              <SortableHeader sortKey="payment">Payment</SortableHeader>
              <SortableHeader sortKey="difficulty">Difficulty</SortableHeader>
              <SortableHeader sortKey="status">Status</SortableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextAction(project, { x: e.pageX, y: e.pageY });
                }}
              >
                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-gray-900">{project.name}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-600">{project.client}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-600">{project.startDate}</div>
                </td>
                <td className="py-4 px-6">
                  <div className={`text-sm ${getDeadlineStatus(project.deadline, project.status).className}`}>
                    {project.deadline}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.type} type="project-type" />
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(project.payment)}</div>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.difficulty} type="difficulty" />
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
