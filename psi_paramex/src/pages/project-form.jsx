import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Clock,
  BarChart3,
  Circle,
} from "lucide-react";
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

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const todayDate = getTodayDate();

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
    
    // Additional validation before submit
    if (!editMode) {
      const startDate = new Date(formData.startDate);
      const deadline = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      if (startDate < today) {
        alert("Start date cannot be in the past");
        return;
      }
      
      if (deadline < today) {
        alert("Deadline cannot be in the past");
        return;
      }
      
      if (deadline < startDate) {
        alert("Deadline cannot be before start date");
        return;
      }
    }
    
    await onSubmit(formData);
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    // Remove any non-numeric characters except digits
    let numericValue = value.toString().replace(/[^\d]/g, "");
    
    // Limit to maximum 15 digits to prevent precision issues
    if (numericValue.length > 15) {
      numericValue = numericValue.slice(0, 15);
    }
    
    // Format with dot as thousand separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseCurrency = (value) => {
    if (!value) return "";
    // Remove dots (thousand separators) and keep only digits
    let numericValue = value.toString().replace(/\./g, "").replace(/[^\d]/g, "");
    
    // Limit to maximum 15 digits
    if (numericValue.length > 15) {
      numericValue = numericValue.slice(0, 15);
    }
    
    return numericValue === "" ? "" : numericValue;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields when not in edit mode
    if (!editMode && (name === "startDate" || name === "deadline")) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        alert(`${name === "startDate" ? "Start date" : "Deadline"} cannot be in the past`);
        return;
      }
      
      // If setting deadline, make sure it's not before start date
      if (name === "deadline" && formData.startDate) {
        const startDate = new Date(formData.startDate);
        if (selectedDate < startDate) {
          alert("Deadline cannot be before start date");
          return;
        }
      }
      
      // If setting start date, make sure existing deadline is not before it
      if (name === "startDate" && formData.deadline) {
        const deadlineDate = new Date(formData.deadline);
        if (deadlineDate < selectedDate) {
          alert("Start date cannot be after deadline");
          return;
        }
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === "payment" ? parseCurrency(value) : value,
    }));
  };

  // const getStatusDotColor = (statusName) => {
  //   switch (statusName?.toLowerCase()) {
  //     case 'on-process':
  //       return 'text-yellow-500';
  //     case 'on-plan':
  //       return 'text-blue-500';
  //     case 'done':
  //       return 'text-green-500';
  //     default:
  //       return 'text-gray-400';
  //   }
  // };

  // const getDifficultyDotColor = (difficulty) => {
  //   switch (difficulty?.toLowerCase()) {
  //     case 'low':
  //       return 'text-green-500';
  //     case 'medium':
  //       return 'text-yellow-500';
  //     case 'high':
  //       return 'text-red-500';
  //     default:
  //       return 'text-gray-400';
  //   }
  // };

  // const getTypeDotColor = (typeId) => {
  //   const colors = [
  //     'text-purple-500',
  //     'text-indigo-500', 
  //     'text-pink-500',
  //     'text-teal-500',
  //     'text-orange-500',
  //     'text-cyan-500'
  //   ];
  //   return colors[typeId % colors.length] || 'text-gray-400';
  // };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      min={!editMode ? todayDate : undefined}
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
                      min={!editMode ? (formData.startDate || todayDate) : undefined}
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
                    <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                    >
                      <option value="">Select difficulty</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                      disabled={typeLoading || !!typeError}
                    >
                      <option value="">
                        {typeLoading ? "Loading types..." : "Select Project type"}
                      </option>
                      {typeError && (
                        <option value="" disabled>
                          {typeError}
                        </option>
                      )}
                      {typeOptions.map((type) => (
                        <option 
                          key={type.type_id} 
                          value={type.type_id}
                        >
                          {type.type_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <Circle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                      disabled={statusLoading || !!statusError}
                    >
                      <option value="">
                        {statusLoading ? "Loading statuses..." : "Select Project status"}
                      </option>
                      {statusError && (
                        <option value="" disabled>
                          {statusError}
                        </option>
                      )}
                      {statusOptions.map((status) => (
                        <option 
                          key={status.status_id} 
                          value={status.status_id}
                        >
                          {status.status_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions - Fixed at bottom */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    editMode ? "Save Changes" : "Save Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}