import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Clock,
  BarChart3,
  Circle,
  ChevronDown,
} from "lucide-react";
import Dropdown from "../components/ui/dropdown";
import { supabase } from "../supabase/supabase";

export function ProjectForm({ onClose, onSubmit, loading, initialData = null, editMode = false }) {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    startDate: "",
    deadline: "",
    payment: "",
    difficulty: "",
    type: "",
    status: "",
  });
  const [typeOptions, setTypeOptions] = useState([]);
  const [typeLoading, setTypeLoading] = useState(true);
  const [typeError, setTypeError] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        client: initialData.client || "",
        startDate: initialData.startDate || "",
        deadline: initialData.deadline || "",
        payment: initialData.payment || "",
        difficulty: initialData.difficulty || "",
        type: initialData.type || "",
        status: initialData.status || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchTypes = async () => {
      setTypeLoading(true);
      setTypeError(null);
      try {
        // Ganti 'project_types' dan kolom sesuai skema Anda
        const { data, error } = await supabase.from("project_type").select("*");
        if (error) throw error;
        setTypeOptions(data || []);
      } catch {
        setTypeError("Failed to load project types");
      } finally {
        setTypeLoading(false);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchStatuses = async () => {
      setStatusLoading(true);
      setStatusError(null);
      try {
        const { data, error } = await supabase.from("project_status").select("*");
        if (error) throw error;
        // Filter out "On-Discuss" status
        const filteredStatuses = (data || []).filter(status => 
          status.status_name?.toLowerCase() !== 'on-discuss'
        );
        setStatusOptions(filteredStatuses);
      } catch {
        setStatusError("Failed to load project statuses");
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatuses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    // Remove any non-numeric characters except digits
    let numericValue = value.toString().replace(/[^\d]/g, "");
    
    // Limit to maximum 10 digits to prevent PostgreSQL INTEGER overflow (2,147,483,647)
    // This allows up to $2.1 billion which should be sufficient for most projects
    if (numericValue.length > 10) {
      numericValue = numericValue.slice(0, 10);
    }
    
    // Format with dot as thousand separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseCurrency = (value) => {
    if (!value) return "";
    // Remove dots (thousand separators) and keep only digits
    let numericValue = value.toString().replace(/\./g, "").replace(/[^\d]/g, "");
    
    // Limit to maximum 10 digits to prevent PostgreSQL INTEGER overflow
    if (numericValue.length > 10) {
      numericValue = numericValue.slice(0, 10);
    }
    
    // Additional safety check: ensure the number doesn't exceed PostgreSQL INTEGER limit
    if (numericValue && parseInt(numericValue) > 2147483647) {
      numericValue = "2147483647";
    }
    
    return numericValue === "" ? "" : numericValue;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "payment" ? parseCurrency(value) : value,
    }));
  };

  const getStatusDotColor = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case 'on-process':
        return 'text-yellow-500';
      case 'on-plan':
        return 'text-blue-500';
      case 'done':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyDotColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeDotColor = (typeId) => {
    const colors = [
      'text-purple-500',
      'text-indigo-500', 
      'text-pink-500',
      'text-teal-500',
      'text-orange-500',
      'text-cyan-500'
    ];
    return colors[typeId % colors.length] || 'text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editMode ? "Edit Project" : "Add New Project"}
            </h2>
            <p className="text-gray-600 mt-1">
              {editMode
                ? "Update the details below to edit the project. Click save when you're done."
                : "Fill in the details below to create a new project. Click save when you're done."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Enter client name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="payment"
                    value={formatCurrency(formData.payment)}
                    onChange={handleChange}
                    placeholder="Enter Payment Amount"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <div className="relative">
                  <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <Dropdown
                    value={formData.difficulty}
                    onChange={(value) => handleChange({ target: { name: "difficulty", value } })}
                    options={[
                      { value: "Low", label: "Low" },
                      { value: "Medium", label: "Medium" },
                      { value: "High", label: "High" }
                    ]}
                    placeholder="Select difficulty"
                    variant="form"
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <Dropdown
                    value={formData.type}
                    onChange={(value) => handleChange({ target: { name: "type", value } })}
                    options={typeOptions.map(type => ({
                      value: type.type_id,
                      label: type.type_name
                    }))}
                    placeholder={typeLoading ? "Loading types..." : "Select Project type"}
                    variant="form"
                    disabled={typeLoading || !!typeError}
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <Circle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <Dropdown
                    value={formData.status}
                    onChange={(value) => handleChange({ target: { name: "status", value } })}
                    options={statusOptions.map(status => ({
                      value: status.status_id,
                      label: status.status_name
                    }))}
                    placeholder={statusLoading ? "Loading statuses..." : "Select Project status"}
                    variant="form"
                    disabled={statusLoading || !!statusError}
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>
            {/* Add some bottom padding to ensure content doesn't hide behind sticky buttons */}
            <div className="h-6"></div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              editMode ? "Save Changes" : "Save Project"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}