import React from "react";
import { Search, Plus } from "lucide-react";
import FilterDropdown from "./filter-dropdown";
// import { useNavigate } from "react-router-dom";

export default function SearchAndFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onAddProject,
}) {
  // const navigate = useNavigate();
  const statusOptions = ["all", "On-Process", "On-Plan", "Done", "Overdue"];
  const difficultyOptions = ["all", "Low", "Medium", "High"];
  const deadlineOptions = [
    "all",
    "This Week",
    "This Month",
    "Next Month",
    "Overdue",
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 mb-8">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search Project..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-white shadow-md/5 w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Filters and Add Button */}
      <div className="flex items-center gap-4">
        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3">
          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            placeholder="All Status"
          />

          <FilterDropdown
            label="Difficulty"
            options={difficultyOptions}
            value={filters.difficulty}
            onChange={(value) => handleFilterChange("difficulty", value)}
            placeholder="All Difficulty"
          />

          <FilterDropdown
            label="Deadline"
            options={deadlineOptions}
            value={filters.deadline}
            onChange={(value) => handleFilterChange("deadline", value)}
            placeholder="Deadline"
          />
        </div>

        {/* Add Project Button */}
        <button
          onClick={onAddProject}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>
    </div>
  );
}
