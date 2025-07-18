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
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { supabase } from "../supabase/supabase";

export function ProjectForm({ onClose, onSubmit, loading, initialData = null, editMode = false }) {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    start_date: new Date().toISOString().split('T')[0],
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
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);


  const [projectHistory, setProjectHistory] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        client: initialData.client || "",
        start_date: initialData.start_date || "",
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

  // Fetch project history for AI recommendations
  useEffect(() => {
    const fetchProjectHistory = async () => {
      if (!editMode) { // Only fetch for new projects
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data, error } = await supabase
              .from("projects")
              .select(`
                *,
                type_id:type_id ( type_name ),
                status_id:status_id ( status_name )
              `)
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: false });
            
            if (!error && data) {
              setProjectHistory(data);
            }
          }
        } catch (error) {
          console.error("Error fetching project history:", error);
        }
      }
    };
    fetchProjectHistory();
  }, [editMode]);

  // Generate AI recommendations based on project history
  const generateAIRecommendations = async () => {
    if (projectHistory.length === 0) {
      // For new users, provide basic recommendations
      setAiRecommendations({
        decision: {
          recommendation: "proceed",
          confidence: 85,
          reasoning: "This is your first project - perfect time to start building your portfolio!"
        },
        pricing: {
          suggested: 1500,
          range: { min: 1000, max: 2500 },
          reasoning: "Market-standard pricing for new freelancers"
        },
        timeline: {
          suggested: 30,
          reasoning: "Standard timeline for first project to ensure quality delivery"
        },
        workload: {
          currentLoad: 0,
          recommendation: "Ideal time to start - no current workload",
          status: "low"
        },
        insights: [
          "This will be your first project - exciting opportunity to build reputation",
          "Focus on delivering high quality to get positive reviews",
          "Consider starting with a moderate scope to build confidence"
        ]
      });
      return;
    }
    
    setRecommendationsLoading(true);
    try {
      // Prepare project data for AI analysis
      const projectData = {
        totalProjects: projectHistory.length,
        completedProjects: projectHistory.filter(p => p.status_id?.status_name === "Done"),
        ongoingProjects: projectHistory.filter(p => 
          p.status_id?.status_name === "On-Process" || p.status_id?.status_name === "On-Plan"
        ),
        projectTypes: projectHistory.map(p => p.type_id?.type_name).filter(Boolean),
        averagePayment: projectHistory.reduce((sum, p) => sum + (p.payment_amount || 0), 0) / projectHistory.length,
        recentProjects: projectHistory.slice(0, 5)
      };

      // Calculate success metrics
      const completionRate = (projectData.completedProjects.length / projectData.totalProjects) * 100;
      const currentWorkload = projectData.ongoingProjects.length;
      
      // Call AI backend for intelligent decision making
      const aiResponse = await fetch('http://localhost:8000/api/project-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
          project_history: projectData,
          completion_rate: completionRate,
          current_workload: currentWorkload,
          request_type: 'new_project_decision'
        })
      });

      let aiDecision;
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiDecision = aiData.decision;
      } else {
        // Fallback to local analysis if AI service is down
        aiDecision = generateLocalAnalysis(projectData, completionRate, currentWorkload);
      }

      setAiRecommendations(aiDecision);
      
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      // Fallback to local analysis
      const projectData = {
        totalProjects: projectHistory.length,
        completedProjects: projectHistory.filter(p => p.status_id?.status_name === "Done"),
        ongoingProjects: projectHistory.filter(p => 
          p.status_id?.status_name === "On-Process" || p.status_id?.status_name === "On-Plan"
        ),
      };
      
      const completionRate = (projectData.completedProjects.length / projectData.totalProjects) * 100;
      const currentWorkload = projectData.ongoingProjects.length;
      
      const localDecision = generateLocalAnalysis(projectData, completionRate, currentWorkload);
      setAiRecommendations(localDecision);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Local fallback analysis
  const generateLocalAnalysis = (projectData, completionRate, currentWorkload) => {
    const avgPayment = projectData.totalProjects > 0 ? 
      projectHistory.reduce((sum, p) => sum + (p.payment_amount || 0), 0) / projectHistory.length : 1500;
    
    // Calculate average timeline
    let totalDuration = 0;
    let validProjects = 0;
    
    projectData.completedProjects.forEach(p => {
      if (p.start_date && p.deadline) {
        const start = new Date(p.start_date);
        const end = new Date(p.deadline);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (duration > 0) {
          totalDuration += duration;
          validProjects++;
        }
      }
    });
    
    const avgTimeline = validProjects > 0 ? Math.round(totalDuration / validProjects) : 30;
    
    // AI Decision Logic
    let decision, confidence, reasoning;
    
    if (currentWorkload >= 5) {
      decision = "defer";
      confidence = 90;
      reasoning = "Your workload is at capacity (5+ active projects). Focus on completing current projects first to maintain quality.";
    } else if (completionRate < 70 && projectData.totalProjects > 3) {
      decision = "caution";
      confidence = 75;
      reasoning = `Your completion rate is ${completionRate.toFixed(1)}%. Consider improving current project delivery before taking on new work.`;
    } else if (currentWorkload <= 2 && completionRate >= 80) {
      decision = "proceed";
      confidence = 95;
      reasoning = `Excellent opportunity! You have low workload (${currentWorkload} projects) and strong completion rate (${completionRate.toFixed(1)}%).`;
    } else {
      decision = "proceed";
      confidence = 80;
      reasoning = `Good position to take on new work. Current workload: ${currentWorkload} projects.`;
    }

    return {
      decision: {
        recommendation: decision,
        confidence: confidence,
        reasoning: reasoning
      },
      pricing: {
        suggested: Math.round(avgPayment * 1.1),
        range: {
          min: Math.round(avgPayment * 0.8),
          max: Math.round(avgPayment * 1.3)
        },
        reasoning: `Based on ${projectData.totalProjects} projects with average payment of $${Math.round(avgPayment).toLocaleString()}`
      },
      timeline: {
        suggested: avgTimeline,
        reasoning: validProjects > 0 ? 
          `Based on ${validProjects} completed projects (avg: ${avgTimeline} days)` :
          "Standard timeline recommendation"
      },
      workload: {
        currentLoad: currentWorkload,
        recommendation: currentWorkload >= 5 ? 
          "HIGH WORKLOAD - Consider deferring new projects" :
          currentWorkload >= 3 ? 
          "MODERATE WORKLOAD - Proceed with caution" :
          "LOW WORKLOAD - Good capacity for new projects",
        status: currentWorkload >= 5 ? "high" : currentWorkload >= 3 ? "moderate" : "low"
      },
      insights: [
        `Portfolio: ${projectData.totalProjects} total projects, ${completionRate.toFixed(1)}% completion rate`,
        `Performance: ${projectData.completedProjects.length} completed, ${currentWorkload} active projects`,
        `Capacity: ${5 - currentWorkload} project slots available for optimal performance`,
        decision === "proceed" ? "AI recommends proceeding with this project" :
        decision === "caution" ? "AI suggests careful consideration before proceeding" :
        "AI recommends deferring this project"
      ]
    };
  };

  // Auto-generate recommendations when project history is loaded
  useEffect(() => {
    if (projectHistory.length > 0 && !editMode) {
      generateAIRecommendations();
    }
  }, [projectHistory, editMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await onSubmit(formData);
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    
    // Convert to string and clean up
    let stringValue = value.toString();
    
    // Remove any characters except digits, dots, and commas
    stringValue = stringValue.replace(/[^\d.,]/g, "");
    
    // Handle multiple dots - keep only the last one as decimal separator
    const parts = stringValue.split('.');
    if (parts.length > 2) {
      // If multiple dots, treat all but the last as part of the integer
      const integerPart = parts.slice(0, -1).join('');
      const decimalPart = parts[parts.length - 1];
      stringValue = integerPart + '.' + decimalPart;
    }
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart] = stringValue.split('.');
    
    // Remove any non-digit characters from integer part
    let cleanInteger = integerPart.replace(/[^\d]/g, "");
    
    // Limit to maximum 15 digits for integer part
    if (cleanInteger.length > 15) {
      cleanInteger = cleanInteger.slice(0, 15);
    }
    
    // Format integer part with comma as thousand separator
    let formattedInteger = cleanInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Handle decimal part
    if (decimalPart !== undefined) {
      // Clean decimal part (only digits)
      let cleanDecimal = decimalPart.replace(/[^\d]/g, "");
      // Limit to 2 decimal places
      if (cleanDecimal.length > 2) {
        cleanDecimal = cleanDecimal.slice(0, 2);
      }
      return formattedInteger + '.' + cleanDecimal;
    }
    
    return formattedInteger;
  };

  const parseCurrency = (value) => {
    if (!value) return "";
    
    // Convert to string
    let stringValue = value.toString();
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart] = stringValue.split('.');
    
    // Remove commas from integer part and keep only digits
    let cleanInteger = integerPart.replace(/[^\d]/g, "");
    
    // Limit to maximum 15 digits for integer part
    if (cleanInteger.length > 15) {
      cleanInteger = cleanInteger.slice(0, 15);
    }
    
    // Handle decimal part
    if (decimalPart !== undefined) {
      // Clean decimal part (only digits) and limit to 2 places
      let cleanDecimal = decimalPart.replace(/[^\d]/g, "");
      if (cleanDecimal.length > 2) {
        cleanDecimal = cleanDecimal.slice(0, 2);
      }
      return cleanInteger + '.' + cleanDecimal;
    }
    
    return cleanInteger === "" ? "" : cleanInteger;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for payment field
    if (name === "payment") {
      // Allow user to type decimals naturally
      const cleanValue = parseCurrency(value);
      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));
      return;
    }
    
    // Special handling for date fields when not in edit mode
    if (!editMode && (name === "start_date" || name === "deadline")) {
      // Validate date relationships
      if (name === "start_date" && formData.deadline) {
        const startDate = new Date(value);
        const deadlineDate = new Date(formData.deadline);
        if (startDate > deadlineDate) {
          // If start date is after deadline, clear deadline
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            deadline: "",
          }));
          return;
        }
      }
      
      if (name === "deadline" && formData.start_date) {
        const startDate = new Date(formData.start_date);
        const deadlineDate = new Date(value);
        if (deadlineDate < startDate) {
          // If deadline is before start date, don't update
          return;
        }
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
          <div className="p-6 pb-6">
            {/* AI Recommendations Section */}
            {!editMode && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-gray-600" />
                    AI Project Considerations
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    {showRecommendations ? "Hide" : "Show"} Recommendations
                  </button>
                </div>
                
                {showRecommendations && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    {recommendationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-gray-700">Analyzing your project history...</span>
                      </div>
                    ) : aiRecommendations ? (
                      <div className="space-y-4">
                        {/* AI Decision & Workload Combined */}
                        <div className={`p-4 rounded-xl border-2 ${
                          aiRecommendations.decision.recommendation === "proceed" 
                            ? "bg-green-50 border-green-200" 
                            : aiRecommendations.decision.recommendation === "caution"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-red-50 border-red-200"
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-full ${
                              aiRecommendations.decision.recommendation === "proceed" 
                                ? "bg-green-500" 
                                : aiRecommendations.decision.recommendation === "caution"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}>
                              {aiRecommendations.decision.recommendation === "proceed" ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : aiRecommendations.decision.recommendation === "caution" ? (
                                <AlertCircle className="w-5 h-5 text-white" />
                              ) : (
                                <X className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-bold text-lg ${
                                aiRecommendations.decision.recommendation === "proceed" 
                                  ? "text-green-800" 
                                  : aiRecommendations.decision.recommendation === "caution"
                                  ? "text-yellow-800"
                                  : "text-red-800"
                              }`}>
                                AI Decision: {
                                  aiRecommendations.decision.recommendation === "proceed" ? "PROCEED" :
                                  aiRecommendations.decision.recommendation === "caution" ? "PROCEED WITH CAUTION" :
                                  "DEFER PROJECT"
                                }
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-sm font-medium ${
                                  aiRecommendations.decision.recommendation === "proceed" 
                                    ? "text-green-700" 
                                    : aiRecommendations.decision.recommendation === "caution"
                                    ? "text-yellow-700"
                                    : "text-red-700"
                                }`}>
                                  Confidence: {aiRecommendations.decision.confidence}%
                                </span>
                                <div className={`w-16 h-2 rounded-full ${
                                  aiRecommendations.decision.recommendation === "proceed" 
                                    ? "bg-green-200" 
                                    : aiRecommendations.decision.recommendation === "caution"
                                    ? "bg-yellow-200"
                                    : "bg-red-200"
                                }`}>
                                  <div 
                                    className={`h-2 rounded-full ${
                                      aiRecommendations.decision.recommendation === "proceed" 
                                        ? "bg-green-500" 
                                        : aiRecommendations.decision.recommendation === "caution"
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${aiRecommendations.decision.confidence}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              aiRecommendations.workload.status === "high" ? "bg-red-500" :
                              aiRecommendations.workload.status === "moderate" ? "bg-yellow-500" :
                              "bg-green-500"
                            }`}></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-800">Current Workload:</span>
                                <span className="text-sm text-gray-600">
                                  {aiRecommendations.workload.currentLoad} active projects
                                </span>
                              </div>
                              <p className={`text-sm ${
                                aiRecommendations.decision.recommendation === "proceed" 
                                  ? "text-green-700" 
                                  : aiRecommendations.decision.recommendation === "caution"
                                  ? "text-yellow-700"
                                  : "text-red-700"
                              }`}>
                                {aiRecommendations.decision.reasoning}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* AI Analysis & Insights */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-800">AI Analysis & Insights</span>
                          </div>
                          <ul className="space-y-1">
                            {aiRecommendations.insights.map((insight, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : projectHistory.length === 0 ? (
                      <div className="text-center py-6">
                        <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-700 font-medium">Welcome to your first project!</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Complete some projects to get personalized AI recommendations
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Unable to generate recommendations</p>
                        <button
                          type="button"
                          onClick={generateAIRecommendations}
                          className="text-sm text-gray-600 hover:text-gray-700 mt-2"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
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
                      name="start_date"
                      value={formData.start_date}
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
                      placeholder="Enter amount (e.g., 1,500.50 or 1.5)"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use dot (.) for decimals, comma (,) for thousands
                  </p>
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
            </form>
          </div>
        </div>

        {/* Form Actions - Sticky Bottom */}
        <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200 rounded-b-2xl">
          <div className="flex gap-3">
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
              onClick={handleSubmit}
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
    </div>
  );
}