"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const DSS = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [weights, setWeights] = useState({
    deadline: 40,
    payment: 30,
    difficulty: 30,
  })
  const [selectedProjects, setSelectedProjects] = useState("all")
  const [priorityResults, setPriorityResults] = useState([])
  const navigate = useNavigate()

  // Add custom CSS for sliders
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .deadline-slider::-webkit-slider-thumb,
      .payment-slider::-webkit-slider-thumb,
      .difficulty-slider::-webkit-slider-thumb {
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #F9FAFB;
        border: 2px solid #D1D5DB;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .deadline-slider::-webkit-slider-thumb:hover,
      .payment-slider::-webkit-slider-thumb:hover,
      .difficulty-slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }
      .deadline-slider::-webkit-slider-thumb:active,
      .payment-slider::-webkit-slider-thumb:active,
      .difficulty-slider::-webkit-slider-thumb:active {
        transform: scale(0.95);
      }

      /* Firefox slider thumb */
      .deadline-slider::-moz-range-thumb,
      .payment-slider::-moz-range-thumb,
      .difficulty-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .deadline-slider::-moz-range-thumb,
      .payment-slider::-moz-range-thumb,
      .difficulty-slider::-moz-range-thumb {
        background: #F9FAFB;
        border: 2px solid #D1D5DB;
      }

      /* Slider track styling */
      .deadline-slider::-webkit-slider-track,
      .payment-slider::-webkit-slider-track,
      .difficulty-slider::-webkit-slider-track {
        height: 8px;
        border-radius: 10px;
        outline: none;
      }

      .deadline-slider:hover,
      .payment-slider:hover,
      .difficulty-slider:hover {
        opacity: 0.8;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }

      .deadline-slider:focus,
      .payment-slider:focus,
      .difficulty-slider:focus {
        animation: pulse 2s ease-in-out infinite;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session) {
          navigate("/login")
          return
        }

        await fetchProjects(session.user.id)
      } catch (error) {
        console.error("Auth error:", error)
        navigate("/login")
      }
    }

    checkAuth()
  }, [navigate])

  // Fetch projects from Supabase
  const fetchProjects = async (userId) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          type_id:type_id ( type_name ),
          status_id:status_id ( status_name )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Map the data to include status from status_id relation and correct field names
      const mappedProjects = (data || []).map(project => ({
        ...project,
        id: project.project_id,
        name: project.project_name,
        client: project.client_name,
        deadline: project.deadline,
        payment: project.payment_amount,
        difficulty: project.difficulty_level,
        status: project.status_id?.status_name || "unknown",
        project_type: project.type_id?.type_name || "unknown"
      })).filter(project => project.status_id?.status_name !== "Done") // Filter out completed projects

      console.log("DSS Projects loaded:", mappedProjects)
      setProjects(mappedProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate priority scores
  const calculatePriority = async () => {
    setCalculating(true)

    // Simulate calculation delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let projectsToAnalyze = projects

    if (selectedProjects !== "all") {
      projectsToAnalyze = projects.filter((p) => p.status === selectedProjects)
    }

    const results = projectsToAnalyze.map((project) => {
      // Calculate deadline score (closer deadline = higher score)
      const daysUntilDeadline = Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      const deadlineScore = Math.max(0, Math.min(100, 100 - daysUntilDeadline * 2))

      // Calculate payment score (higher payment = higher score)
      const maxPayment = Math.max(...projectsToAnalyze.map((p) => p.payment || 0))
      const paymentScore = maxPayment > 0 ? ((project.payment || 0) / maxPayment) * 100 : 0

      // Calculate difficulty score (higher difficulty = lower score for prioritization)
      const difficultyScore = project.difficulty === "high" ? 30 : project.difficulty === "medium" ? 60 : 90

      // Calculate weighted score
      const totalScore = Math.round(
        (deadlineScore * weights.deadline) / 100 +
          (paymentScore * weights.payment) / 100 +
          (difficultyScore * weights.difficulty) / 100,
      )

      return {
        ...project,
        score: totalScore,
        factors: {
          deadline: daysUntilDeadline <= 7 ? "High" : daysUntilDeadline <= 30 ? "Medium" : "Low",
          payment: (project.payment || 0) >= 5000 ? "High" : (project.payment || 0) >= 2000 ? "Medium" : "Low",
          difficulty: project.difficulty || "medium",
        },
      }
    })

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score)
    setPriorityResults(results)
    setCalculating(false)
  }

  const handleWeightChange = (name, value) => {
    setWeights((prev) => ({
      ...prev,
      [name]: value[0],
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Loading DSS...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto" style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Decision Support System</h1>
            <p style={styles.subtitle}>
              Get intelligent project prioritization based on deadline, payment, and difficulty factors
            </p>
          </div>
        </div>

        <div style={styles.content}>
          {/* DSS Form */}
          <div style={styles.formCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <SettingsIcon />
                Configure Priority Weights
              </h2>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.weightsContainer}>
                {/* Deadline Weight */}
                <div style={styles.weightGroup}>
                  <div style={styles.weightHeader}>
                    <label style={styles.weightLabel}>Deadline Weight</label>
                    <span style={{
                      ...styles.weightValue,
                      background: "linear-gradient(135deg, #495057, #343A40)",
                      backgroundColor: "transparent",
                      border: "none",
                    }}>{weights.deadline}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weights.deadline}
                    onChange={(e) => handleWeightChange("deadline", [Number.parseInt(e.target.value)])}
                    style={{
                      ...styles.slider,
                      ...styles.sliderDeadline,
                    }}
                    className="deadline-slider"
                  />
                </div>

                {/* Payment Weight */}
                <div style={styles.weightGroup}>
                  <div style={styles.weightHeader}>
                    <label style={styles.weightLabel}>Payment Weight</label>
                    <span style={{
                      ...styles.weightValue,
                      background: "linear-gradient(135deg, #495057, #343A40)",
                      backgroundColor: "transparent",
                      border: "none",
                    }}>{weights.payment}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weights.payment}
                    onChange={(e) => handleWeightChange("payment", [Number.parseInt(e.target.value)])}
                    style={{
                      ...styles.slider,
                      ...styles.sliderPayment,
                    }}
                    className="payment-slider"
                  />
                </div>

                {/* Difficulty Weight */}
                <div style={styles.weightGroup}>
                  <div style={styles.weightHeader}>
                    <label style={styles.weightLabel}>Difficulty Weight</label>
                    <span style={{
                      ...styles.weightValue,
                      background: "linear-gradient(135deg, #495057, #343A40)",
                      backgroundColor: "transparent",
                      border: "none",
                    }}>{weights.difficulty}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weights.difficulty}
                    onChange={(e) => handleWeightChange("difficulty", [Number.parseInt(e.target.value)])}
                    style={{
                      ...styles.slider,
                      ...styles.sliderDifficulty,
                    }}
                    className="difficulty-slider"
                  />
                </div>
              </div>

              {/* Project Selection */}
              <div style={styles.projectSelection}>
                <label style={styles.selectLabel}>Projects to Analyze</label>
                <select
                  value={selectedProjects}
                  onChange={(e) => setSelectedProjects(e.target.value)}
                  style={styles.select}
                >
                  <option value="all">All Active Projects</option>
                  <option value="On-Plan">On-Plan Projects</option>
                  <option value="On-Process">On-Process Projects</option>
                </select>
              </div>

              {/* Calculate Button */}
              {/* Debug info */}
              <div style={{ marginBottom: "16px", fontSize: "14px", color: "#6B7280" }}>
                Projects loaded: {projects.length} 
                {projects.length === 0 && " (Button disabled - no projects found)"}
              </div>

              <button
                onClick={calculatePriority}
                disabled={calculating || projects.length === 0}
                style={{
                  ...styles.calculateButton,
                  ...(calculating || projects.length === 0 ? styles.calculateButtonDisabled : {}),
                }}
              >
                {calculating ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <CalculateIcon />
                    Calculate Priority
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div style={styles.resultsCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <ResultsIcon />
                Priority Results
              </h2>
            </div>
            <div style={styles.cardContent}>
              {priorityResults.length === 0 ? (
                <div style={styles.emptyResults}>
                  <ChartIcon />
                  <h3 style={styles.emptyTitle}>No Results Yet</h3>
                  <p style={styles.emptyDescription}>
                    Configure your priority weights and click "Calculate Priority" to see intelligent project
                    recommendations.
                  </p>
                </div>
              ) : (
                <div style={styles.resultsList}>
                  {priorityResults.map((result, index) => {
                    // Calculate progress percentage based on highest score
                    const maxScore = Math.max(...priorityResults.map(r => r.score))
                    const progressPercentage = maxScore > 0 ? (result.score / maxScore) * 100 : 0
                    
                    return (
                      <div key={result.id} style={styles.resultItem}>
                          <div style={styles.resultRank}>#{index + 1}</div>
                            <div style={styles.resultContent}>
                              <div style={styles.resultItem2}>
                                <div style={styles.resultContent}>
                                  <div style={styles.resultHeader}>
                                    <h3 style={styles.resultTitle}>{result.name}</h3>
                                  </div>
                                  <p style={styles.resultClient}>Client: {result.client}</p>
                                  <div>
                                    <div style={styles.resultFactors}>
                                      <span
                                        style={{
                                          ...styles.factorBadge,
                                          backgroundColor:
                                            result.factors.deadline === "High"
                                              ? "#FEF2F2"
                                              : result.factors.deadline === "Medium"
                                                ? "#FFFBEB"
                                                : "#EFF6FF",
                                          color:
                                            result.factors.deadline === "High"
                                              ? "#DC2626"
                                              : result.factors.deadline === "Medium"
                                                ? "#D97706"
                                                : "#2563EB",
                                        }}
                                      >
                                        Deadline: {result.factors.deadline}
                                      </span>
                                      <span
                                        style={{
                                          ...styles.factorBadge,
                                          backgroundColor:
                                            result.factors.payment === "High"
                                              ? "#ECFDF5"
                                              : result.factors.payment === "Medium"
                                                ? "#FFFBEB"
                                                : "#EFF6FF",
                                          color:
                                            result.factors.payment === "High"
                                              ? "#059669"
                                              : result.factors.payment === "Medium"
                                                ? "#D97706"
                                                : "#2563EB",
                                        }}
                                      >
                                        Payment: {result.factors.payment}
                                      </span>
                                      <span
                                        style={{
                                          ...styles.factorBadge,
                                          backgroundColor:
                                            result.factors.difficulty === "high"
                                              ? "#FEF2F2"
                                              : result.factors.difficulty === "medium"
                                                ? "#FFFBEB"
                                                : "#ECFDF5",
                                          color:
                                            result.factors.difficulty === "high"
                                              ? "#DC2626"
                                              : result.factors.difficulty === "medium"
                                                ? "#D97706"
                                                : "#059669",
                                        }}
                                      >
                                        Difficulty:{" "}
                                        {result.factors.difficulty.charAt(0).toUpperCase() + result.factors.difficulty.slice(1)}
                                      </span>
                                    </div>
                                </div>
                              </div>
                            <div style={styles.resultScore}>
                              <span style={styles.scoreValue}>{result.score}</span>
                              <span style={styles.scoreLabel}>Priority Score</span>
                            </div>  
                            </div>
                                                     <div style={styles.progressContainer}>
                             <div style={styles.progressBar}>
                               <div
                                 style={{
                                   ...styles.progressFill,
                                   width: `${progressPercentage}%`,
                                   backgroundColor:
                                     index === 0 ? "#DC2626" : index === 1 ? "#D97706" : index === 2 ? "#F59E0B" : "#3B82F6",
                                 }}
                               ></div>
                             </div>
                           </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Icon Components
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const CalculateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="1" height="1" />
    <rect x="14" y="9" width="1" height="1" />
    <rect x="9" y="14" width="1" height="1" />
    <rect x="14" y="14" width="1" height="1" />
  </svg>
)

const ResultsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
)

const ChartIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: 0,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "32px",
    alignItems: "start",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    overflow: "hidden",
  },
  resultsCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "24px 32px 0 32px",
    borderBottom: "1px solid #F3F4F6",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardContent: {
    padding: "0 32px 32px 32px",
  },
  weightsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "32px",
  },
  weightGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  weightHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weightLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },
  weightValue: {
    fontSize: "14px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    padding: "0",
    borderRadius: "0",
    backgroundColor: "transparent",
    border: "none",
    minWidth: "auto",
    textAlign: "right",
    display: "inline-block",
  },
  slider: {
    width: "100%",
    height: "8px",
    borderRadius: "10px",
    background: "#E5E7EB",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    transition: "all 0.3s ease",
    position: "relative",
  },
  sliderDeadline: {
    background: "#E5E7EB",
  },
  sliderPayment: {
    background: "#E5E7EB",
  },
  sliderDifficulty: {
    background: "#E5E7EB",
  },
  sliderThumb: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ffffff, #f8fafc)",
    border: "3px solid #3B82F6",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(59, 130, 246, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.1)",
    appearance: "none",
    WebkitAppearance: "none",
    transition: "all 0.3s ease",
  },
  projectSelection: {
    marginBottom: "32px",
  },
  selectLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    outline: "none",
  },
  calculateButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px 24px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    transition: "all 0.2s",
  },
  calculateButtonDisabled: {
    backgroundColor: "#9CA3AF",
    cursor: "not-allowed",
  },
  buttonSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid transparent",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyResults: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    margin: "16px 0 8px 0",
  },
  emptyDescription: {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
    maxWidth: "400px",
    lineHeight: "1.5",
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  resultItem: {
    display: "flex",
    gap: "16px",
    padding: "20px",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    backgroundColor: "#FAFAFA",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  resultItem2: {
    display: "flex",
  },
  resultRank: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    backgroundColor: "#3B82F6",
    color: "white",
    borderRadius: "50%",
    fontSize: "16px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  resultTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    margin: 0,
  },
  resultScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  scoreValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1F2937",
  },
  scoreLabel: {
    fontSize: "12px",
    color: "#6B7280",
  },
  resultClient: {
    fontSize: "14px",
    color: "#6B7280",
    margin: "0 0 12px 0",
  },
  resultFactors: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  factorBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  progressContainer: {
    width: "100%",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#E5E7EB",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
}

export default DSS