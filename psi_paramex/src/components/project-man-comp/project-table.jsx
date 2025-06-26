import React from "react";
import StatusBadge from "./status-badge";

export default function ProjectTable({ projects, onRowClick, onContextAction }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Project Name</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Client</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Start Date</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Deadline</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Payment</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Difficulty</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 transition-colors duration-150"
                onClick={() => onRowClick(project)}
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
                  <div className="text-sm text-gray-600">{project.deadline}</div>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={project.type} type="project-type" />
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm font-medium text-gray-900">{project.payment}</div>
                </td>
                <td className="py-4 px-6">
                  <div className={`text-sm font-medium capitalize ${getDifficultyColor(project.difficulty)}`}>
                    {project.difficulty}
                  </div>
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
