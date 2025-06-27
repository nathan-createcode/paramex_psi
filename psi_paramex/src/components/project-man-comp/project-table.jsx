import React from "react";
import StatusBadge from "./status-badge";
import { formatCurrency, getDeadlineStatus } from "../../utils/project-utils";

export default function ProjectTable({ projects, onRowClick, onContextAction, sortConfig, onSort }) {
  // Komponen header yang dapat di-sort
  const SortableHeader = ({ children, sortKey }) => (
    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">
      <button
        className="hover:text-blue-600 transition-colors w-full"
        onClick={() => onSort && onSort(sortKey)}
      >
        {children}
      </button>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Fixed Header */}
      <div className="border-b border-gray-200">
        <table className="w-full table-fixed" style={{ width: 'calc(100% - 17px)' }}>
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead className="bg-white">
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
        </table>
      </div>
      
      {/* Scrollable Body */}
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
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
                <td className="py-4 px-6 overflow-hidden text-center">
                  <div className="text-sm font-medium text-gray-900 truncate">{project.name}</div>
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
                  <div className="text-sm text-gray-600 truncate">{project.client}</div>
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
                  <div className="text-sm text-gray-600 truncate">{project.startDate}</div>
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
                  <div className={`text-sm truncate ${getDeadlineStatus(project.deadline, project.status).className}`}>
                    {project.deadline}
                  </div>
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
                  <StatusBadge status={project.type} type="project-type" />
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
                  <div className="text-sm font-medium text-gray-900 truncate">{formatCurrency(project.payment)}</div>
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
                  <StatusBadge status={project.difficulty} type="difficulty" />
                </td>
                <td className="py-4 px-6 overflow-hidden text-center">
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
