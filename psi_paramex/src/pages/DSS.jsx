"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from "lucide-react"
import { supabase } from "../supabase/supabase"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"

const DSS = () => {
  const navigate = useNavigate()
  const [expandedProjects, setExpandedProjects] = useState(new Set())
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState(null)

  /**
   * Priority Score Calculation Formula:
   * Priority Score = (deadline_score × 9) + (payment_score × 7) + (difficulty_score × 5)
   *
   * Weights: Deadline=9, Payment=7, Difficulty=5
   * Max Priority Score: (5×9) + (3×7) + (3×5) = 81
   *
   * Scoring System:
   * - Deadline: 1-5 (based on urgency)
   * - Payment: Low=1, Medium=2, High=3
   * - Difficulty: Low=3, Medium=2, High=1 (inverted - easier gets higher priority)
   */

  // Updated normalization function for max score 81
  const normalizeScore = (rawScore) => Math.round((rawScore / 81) * 100)

  // Check authentication first
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
        setUser(session.user)
        await fetchProjects(session.user.id)
      } catch (error) {
        console.error("Auth error:", error)
        navigate("/login")
      }
    }
    checkAuth()
  }, [navigate])

  // Fetch projects from database - FIXED: Added user filtering
  const fetchProjects = async (userId) => {
    try {
      setLoading(true)
      // FIXED: Added user_id filter and made status filter optional
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_status(status_name),
          project_type(type_name)
        `)
        .eq("user_id", userId) // FIXED: Filter by current user
        .neq("status_id", 3) // Exclude projects with status "Done" for DSS prioritization
        .neq("status_id", 4)
        .order("priority_score", { ascending: false })

      if (error) {
        console.error("Error fetching projects:", error)
        return
      }

      // Transform data to match the expected format
      const transformedProjects = data.map((project) => ({
        id: project.project_id,
        project_name: project.project_name,
        client_name: project.client_name,
        priority_score: project.priority_score || 0,
        deadline_score: project.deadline_score || 1,
        payment_score: project.payment_score || 1,
        difficulty_score: project.difficulty_score || 1,
        payment_amount: project.payment_amount || 0,
        difficulty_level: project.difficulty_level || "Low",
        deadline: project.deadline,
        days_until_deadline: project.deadline
          ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
          : 0,
      }))

      console.log(`DSS: Loaded ${transformedProjects.length} projects for user ${userId}`)
      setProjects(transformedProjects)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Badge Logic Implementation:
   * - Only applies to projects with same priority_score
   * - Priority order: deadline_score > payment_score > difficulty_score
   * - Badge types:
   *   - "Urgent Deadline" - highest deadline_score among tied projects
   */
  const calculateBadges = (projects) => {
    const projectsWithBadges = [...projects]
    // Group projects by priority_score
    const groupedByScore = {}
    projects.forEach((project) => {
      const score = project.priority_score
      if (!groupedByScore[score]) {
        groupedByScore[score] = []
      }
      groupedByScore[score].push(project)
    })

    // Apply badge logic only to groups with multiple projects
    Object.keys(groupedByScore).forEach((score) => {
      const group = groupedByScore[score]
      if (group.length > 1) {
        // Find highest deadline_score
        const maxDeadlineScore = Math.max(...group.map((p) => p.deadline_score))
        const deadlineWinners = group.filter((p) => p.deadline_score === maxDeadlineScore)
        if (deadlineWinners.length === 1) {
          // Single winner by deadline
          const winner = projectsWithBadges.find((p) => p.id === deadlineWinners[0].id)
          winner.urgencyBadge = "Urgent Deadline"
        }
      }
    })

    return projectsWithBadges
  }

  // Advanced Tie-Breaking System
  const advancedSort = (projects) => {
    return projects.sort((a, b) => {
      // Primary sort: Priority Score (descending)
      if (a.priority_score !== b.priority_score) {
        return b.priority_score - a.priority_score
      }
      // Secondary sort: Advanced tie-breaking for same priority_score
      // 1. Deadline tie-breaking (for deadline_score = 1, sort by days ascending)
      if (a.deadline_score === 1 && b.deadline_score === 1 && a.deadline_score === b.deadline_score) {
        if (a.days_until_deadline !== b.days_until_deadline) {
          return a.days_until_deadline - b.days_until_deadline // Lower days = higher priority
        }
      }
      // 2. Payment tie-breaking (for payment_score = 3, sort by amount descending)
      if (a.payment_score === 3 && b.payment_score === 3 && a.payment_score === b.payment_score) {
        if (a.payment_amount !== b.payment_amount) {
          return b.payment_amount - a.payment_amount // Higher amount = higher priority
        }
      }
      // 3. General deadline comparison (higher deadline_score = higher priority)
      if (a.deadline_score !== b.deadline_score) {
        return b.deadline_score - a.deadline_score
      }
      // 4. General payment comparison (higher payment_score = higher priority)
      if (a.payment_score !== b.payment_score) {
        return b.payment_score - a.payment_score
      }
      // 5. Difficulty comparison (higher difficulty_score = higher priority)
      if (a.difficulty_score !== b.difficulty_score) {
        return b.difficulty_score - a.difficulty_score
      }
      // Final fallback: alphabetical by project name
      return a.project_name.localeCompare(b.project_name)
    })
  }

  const projectsWithBadges = advancedSort(calculateBadges(projects))

  // Filter projects based on search query
  const filteredProjectsWithBadges = projectsWithBadges.filter((project) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const projectName = project.project_name.toLowerCase()
    const clientName = project.client_name.toLowerCase()
    return projectName.includes(query) || clientName.includes(query)
  })

  const toggleExpanded = (projectId) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  // Helper function to get deadline level name from days left (REAL-TIME)
  const getDeadlineLevelFromDays = (daysLeft) => {
    if (daysLeft <= 1) {
      return "Super Urgent"
    } else if (daysLeft === 2) {
      return "Urgent"
    } else if (daysLeft >= 3 && daysLeft <= 5) {
      return "High"
    } else if (daysLeft >= 6 && daysLeft <= 9) {
      return "Medium"
    } else {
      return "Low"
    }
  }

  // Update getDeadlineCategory to use days left instead of score
  const getDeadlineCategory = (daysLeft) => {
    if (daysLeft <= 1) {
      return "Super Urgent"
    } else if (daysLeft === 2) {
      return "Urgent"
    } else if (daysLeft >= 3 && daysLeft <= 5) {
      return "High"
    } else if (daysLeft >= 6 && daysLeft <= 9) {
      return "Medium"
    } else {
      return "Low"
    }
  }

  // Update getDeadlineBadgeStyle to use days left
  const getDeadlineBadgeStyle = (daysLeft) => {
    if (daysLeft <= 1) {
      // Super Urgent: Dark Red
      return { backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }
    } else if (daysLeft === 2) {
      // Urgent: Red
      return { backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }
    } else if (daysLeft >= 3 && daysLeft <= 5) {
      // High: Orange
      return { backgroundColor: "#FFF7ED", color: "#F97316", border: "1px solid #FED7AA" }
    } else if (daysLeft >= 6 && daysLeft <= 9) {
      // Medium: Yellow
      return { backgroundColor: "#FFFBEB", color: "#EAB308", border: "1px solid #FDE68A" }
    } else {
      // Low: Green
      return { backgroundColor: "#ECFDF5", color: "#22C55E", border: "1px solid #A7F3D0" }
    }
  }

  const getPaymentCategory = (score) => {
    switch (score) {
      case 1:
        return "Low Payment"
      case 2:
        return "Medium Payment"
      case 3:
        return "High Payment"
      default:
        return "Unknown"
    }
  }

  // Payment badge style (unchanged)
  const getPaymentBadgeStyle = (paymentScore) => {
    switch (paymentScore) {
      case 3:
        // High payment → Red
        return { backgroundColor: "#FEF2F2", color: "#F87171", border: "1px solid #FECACA" }
      case 2:
        // Medium payment → Amber
        return { backgroundColor: "#FFFBEB", color: "#FCD34D", border: "1px solid #FDE68A" }
      case 1:
        // Low payment → Green
        return { backgroundColor: "#ECFDF5", color: "#34D399", border: "1px solid #A7F3D0" }
      default:
        return { backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0" }
    }
  }

  // Difficulty badge style (unchanged)
  const getDifficultyBadgeStyle = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        // High difficulty → Red
        return { backgroundColor: "#FEF2F2", color: "#F87171", border: "1px solid #FECACA" }
      case "medium":
        // Medium difficulty → Amber
        return { backgroundColor: "#FFFBEB", color: "#FCD34D", border: "1px solid #FDE68A" }
      case "low":
        // Low difficulty → Green
        return { backgroundColor: "#ECFDF5", color: "#34D399", border: "1px solid #A7F3D0" }
      default:
        return { backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0" }
    }
  }

  // Payment level mapping (unchanged)
  const getPaymentLevel = (paymentScore) => {
    switch (paymentScore) {
      case 1:
        return "Low"
      case 2:
        return "Medium"
      case 3:
        return "High"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="dss-container">
          <div className="dss-header">
            <div className="dss-header-content">
              <div className="dss-header-icon-container">
                <TrendingUp size={40} color="#FFFFFF" />
              </div>
              <div>
                <h1 className="dss-title">
                  Project Prioritization <span className="dss-title-accent">DSS</span>
                </h1>
                <p className="dss-subtitle">Loading projects...</p>
              </div>
            </div>
          </div>
        </div>
        <style jsx>{`
          .dss-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            padding: 1rem;
          }
          .dss-header {
            margin-bottom: 2rem;
          }
          .dss-header-content {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%);
            border-radius: 1rem;
            box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(79, 156, 249, 0.1);
          }
          .dss-header-icon-container {
            width: 4rem;
            height: 4rem;
            border-radius: 1rem;
            background: linear-gradient(135deg, #4F9CF9 0%, #2B77E5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
          }
          .dss-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1A202C;
            margin: 0 0 0.5rem 0;
          }
          .dss-title-accent {
            color: #4F9CF9;
          }
          .dss-subtitle {
            font-size: 1rem;
            font-weight: 400;
            color: #718096;
            margin: 0;
          }
          @media (max-width: 768px) {
            .dss-container {
              padding: 0.5rem;
            }
            .dss-header-content {
              flex-direction: column;
              text-align: center;
              gap: 1rem;
              padding: 1rem;
            }
            .dss-title {
              font-size: 1.5rem;
            }
            .dss-subtitle {
              font-size: 0.875rem;
            }
          }
        `}</style>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="dss-container">
        {/* Enhanced Header Section */}
        <div className="dss-header">
          <div className="dss-header-content">
            <div className="dss-header-icon-container">
              <TrendingUp size={40} color="#FFFFFF" />
            </div>
            <div className="dss-header-text">
              <h1 className="dss-title">
                Project Prioritization <span className="dss-title-accent">DSS</span>
              </h1>
              <p className="dss-subtitle">
                Prioritaskan proyek berdasarkan sistem skor terstruktur berbasis DSS
                {user && (
                  <span className="dss-user-info">
                    Showing{" "}
                    <span className="dss-project-count">{filteredProjectsWithBadges.length} active projects</span> for{" "}
                    {user.user_metadata?.full_name || user.email}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="dss-search-section">
          <div className="dss-search-container">
            <div className="dss-search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari proyek atau klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dss-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="dss-clear-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Priority Result Section */}
        <div className="dss-results-card">
          <div className="dss-card-header">
            <div className="dss-card-header-content">
              <h2 className="dss-card-title">Priority Result</h2>
            </div>
          </div>
          <div className="dss-card-content">
            <div className="dss-projects-list">
              {filteredProjectsWithBadges.map((project, index) => (
                <div key={project.id} className="dss-project-card">
                  {/* Main Content Area - Split into Left and Right */}
                  <div className="dss-card-main-content">
                    {/* Left Side - Project Info */}
                    <div className="dss-left-section">
                      <div className="dss-project-header">
                        <div className="dss-project-title-row">
                          <span className="dss-project-number">#{index + 1}</span>
                          <h3 className="dss-project-name">{project.project_name}</h3>
                          {project.urgencyBadge && (
                            <div className="dss-urgency-badge">
                              <AlertTriangle size={12} color="#FDBA74" />
                              <span className="dss-urgency-badge-text">{project.urgencyBadge}</span>
                            </div>
                          )}
                        </div>
                        <p className="dss-client-name">Client: {project.client_name}</p>
                      </div>
                      {/* Factor Badges with Updated Colors */}
                      <div className="dss-factor-badges">
                        <span className="dss-factor-badge" style={getDeadlineBadgeStyle(project.days_until_deadline)}>
                          Deadline: {getDeadlineLevelFromDays(project.days_until_deadline)} (
                          {project.days_until_deadline} days left)
                        </span>
                        <span className="dss-factor-badge" style={getPaymentBadgeStyle(project.payment_score)}>
                          Payment: {getPaymentLevel(project.payment_score)} (${project.payment_amount.toLocaleString()})
                        </span>
                        <span className="dss-factor-badge" style={getDifficultyBadgeStyle(project.difficulty_level)}>
                          Difficulty: {project.difficulty_level}
                        </span>
                      </div>
                      {/* Details Button */}
                      <div className="dss-details-section">
                        <button className="dss-details-button" onClick={() => toggleExpanded(project.id)}>
                          <span>Details</span>
                          {expandedProjects.has(project.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                    {/* Right Side - Enhanced Priority Score */}
                    <div className="dss-right-section">
                      <div className="dss-score-container">
                        <div className="dss-score-circle">
                          <span className="dss-score-value">{normalizeScore(project.priority_score)}</span>
                        </div>
                        <div className="dss-progress-container">
                          <div className="dss-progress-bar">
                            <div
                              className="dss-progress-fill"
                              style={{ width: `${normalizeScore(project.priority_score)}%` }}
                            />
                          </div>
                        </div>
                        <span className="dss-score-label">Priority Score</span>
                      </div>
                    </div>
                  </div>
                  {/* Expanded Reasoning */}
                  {expandedProjects.has(project.id) && (
                    <div className="dss-reasoning-section">
                      <p className="dss-reasoning-text">
                        Proyek {project.project_name} untuk klien {project.client_name} diprioritaskan karena memiliki
                        nilai Priority Score sebesar {normalizeScore(project.priority_score)}/100. Nilai ini didapat
                        dari kombinasi beberapa faktor:
                      </p>
                      <ul className="dss-reasoning-list">
                        <li>
                          Deadline: (batas waktu {project.days_until_deadline} hari lagi, kategori{" "}
                          {getDeadlineCategory(project.days_until_deadline)})
                        </li>
                        <li>
                          Payment: (nilai pembayaran ${project.payment_amount.toLocaleString()}, kategori{" "}
                          {getPaymentCategory(project.payment_score)})
                        </li>
                        <li>Difficulty: (tingkat kesulitan {project.difficulty_level})</li>
                      </ul>
                      <p className="dss-reasoning-text">
                        Dengan kombinasi nilai tersebut dan bobot masing-masing faktor, proyek ini menempati urutan
                        prioritas saat ini.
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {filteredProjectsWithBadges.length === 0 && searchQuery && (
                <div className="dss-empty-search-state">
                  <div className="dss-empty-search-icon">🔍</div>
                  <h3 className="dss-empty-search-title">Tidak ada proyek ditemukan</h3>
                  <p className="dss-empty-search-description">
                    Tidak ada proyek yang cocok dengan pencarian "{searchQuery}". Coba gunakan kata kunci yang berbeda.
                  </p>
                  <button onClick={() => setSearchQuery("")} className="dss-clear-search-button">
                    Hapus Pencarian
                  </button>
                </div>
              )}
              {filteredProjectsWithBadges.length === 0 && !searchQuery && (
                <div className="dss-empty-search-state">
                  <div className="dss-empty-search-icon">📊</div>
                  <h3 className="dss-empty-search-title">Tidak ada proyek aktif</h3>
                  <p className="dss-empty-search-description">
                    Semua proyek Anda sudah selesai atau belum ada proyek yang perlu diprioritaskan.
                  </p>
                  <button onClick={() => navigate("/projects")} className="dss-clear-search-button">
                    Kelola Proyek
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dss-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dss-header {
          margin-bottom: 2.5rem;
        }

        .dss-header-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%);
          border-radius: 1rem;
          box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(79, 156, 249, 0.1);
        }

        .dss-header-icon-container {
          width: 4rem;
          height: 4rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #4F9CF9 0%, #2B77E5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
        }

        .dss-header-text {
          flex: 1;
        }

        .dss-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1A202C;
          margin: 0 0 0.5rem 0;
        }

        .dss-title-accent {
          color: #4F9CF9;
        }

        .dss-subtitle {
          font-size: 1rem;
          font-weight: 400;
          color: #718096;
          margin: 0;
          line-height: 1.5;
        }

        .dss-user-info {
          display: block;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          color: #718096;
        }

        .dss-project-count {
          background-color: #EBF4FF;
          color: #3B82F6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid #BFDBFE;
        }

        .dss-search-section {
          margin-bottom: 1.5rem;
        }

        .dss-search-container {
          position: relative;
          max-width: 500px;
        }

        .dss-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .dss-search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          font-weight: 400;
          color: #374151;
          background-color: white;
          border: 1px solid #E5E7EB;
          border-radius: 1rem;
          outline: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .dss-search-input:focus {
          border-color: #4F9CF9;
          box-shadow: 0 0 0 3px rgba(79, 156, 249, 0.1);
        }

        .dss-clear-button {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .dss-clear-button:hover {
          background-color: #F3F4F6;
        }

        .dss-results-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%);
          border-radius: 1.25rem;
          box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.15), -12px -12px 24px rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(79, 156, 249, 0.1);
          overflow: hidden;
        }

        .dss-card-header {
          padding: 2rem 2rem 1.5rem 2rem;
        }

        .dss-card-header-content {
          padding: 1.25rem;
          background: linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%);
          border-radius: 0.75rem;
          box-shadow: inset 2px 2px 6px rgba(163, 177, 198, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(79, 156, 249, 0.1);
        }

        .dss-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A202C;
          margin: 0;
          text-align: center;
        }

        .dss-card-content {
          padding: 0 2rem 2rem 2rem;
        }

        .dss-projects-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: 700px;
          overflow-y: auto;
        }

        .dss-project-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%);
          border-radius: 1rem;
          padding: 1.75rem;
          box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.12), -8px -8px 16px rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(79, 156, 249, 0.1);
        }

        .dss-card-main-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .dss-left-section {
          flex: 1;
        }

        .dss-right-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 160px;
          flex-shrink: 0;
        }

        .dss-project-header {
          margin-bottom: 1rem;
        }

        .dss-project-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.375rem;
          flex-wrap: wrap;
        }

        .dss-project-number {
          font-size: 0.75rem;
          font-weight: 700;
          color: #718096;
          background: linear-gradient(135deg, #F7F9FC 0%, #EEF4FF 100%);
          padding: 0.375rem 0.625rem;
          border-radius: 0.5rem;
          flex-shrink: 0;
          box-shadow: 2px 2px 4px rgba(163, 177, 198, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.8);
        }

        .dss-project-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1A202C;
          margin: 0;
          flex-shrink: 0;
        }

        .dss-urgency-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background-color: #FFF7ED;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid #FED7AA;
          flex-shrink: 0;
        }

        .dss-urgency-badge-text {
          font-size: 0.625rem;
          font-weight: 600;
          color: #FDBA74;
          white-space: nowrap;
        }

        .dss-client-name {
          font-size: 0.875rem;
          font-weight: 400;
          color: #718096;
          margin: 0;
        }

        .dss-factor-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .dss-factor-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          box-shadow: 2px 2px 4px rgba(163, 177, 198, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.8);
          white-space: nowrap;
        }

        .dss-details-section {
          display: flex;
          justify-content: flex-start;
        }

        .dss-details-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%);
          border: 1px solid rgba(79, 156, 249, 0.2);
          color: #4F9CF9;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 0.625rem;
          transition: all 0.2s ease;
          box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .dss-details-button:hover {
          background: linear-gradient(135deg, #EEF4FF 0%, #E0F2FE 100%);
          transform: translateY(-1px);
        }

        .dss-score-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.25rem;
          background: linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%);
          border-radius: 1rem;
          box-shadow: inset 2px 2px 6px rgba(163, 177, 198, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(79, 156, 249, 0.1);
          min-width: 140px;
        }

        .dss-score-circle {
          width: 5rem;
          height: 5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #4F9CF9 0%, #2B77E5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          box-shadow: 0 4px 12px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .dss-score-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .dss-progress-container {
          width: 6.25rem;
          margin-bottom: 0.5rem;
        }

        .dss-progress-bar {
          width: 100%;
          height: 0.5rem;
          background-color: #E2E8F0;
          border-radius: 0.25rem;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dss-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4F9CF9 0%, #2B77E5 50%, #1E5FCC 100%);
          border-radius: 0.25rem;
          transition: width 0.3s ease;
          box-shadow: 0 1px 2px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .dss-score-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: #718096;
        }

        .dss-reasoning-section {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, #F7F9FC 0%, #EEF4FF 100%);
          border-radius: 0.75rem;
          box-shadow: inset 2px 2px 6px rgba(163, 177, 198, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(79, 156, 249, 0.1);
        }

        .dss-reasoning-text {
          font-size: 0.875rem;
          font-weight: 400;
          color: #1A202C;
          line-height: 1.6;
          margin: 0 0 0.75rem 0;
        }

        .dss-reasoning-list {
          font-size: 0.875rem;
          font-weight: 400;
          color: #1A202C;
          line-height: 1.6;
          margin: 0.75rem 0;
          padding-left: 1.25rem;
        }

        .dss-empty-search-state {
          text-align: center;
          padding: 3.75rem 1.25rem;
          background-color: white;
          border-radius: 1rem;
          box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.12), -8px -8px 16px rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(79, 156, 249, 0.1);
        }

        .dss-empty-search-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .dss-empty-search-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1A202C;
          margin: 0 0 0.5rem 0;
        }

        .dss-empty-search-description {
          font-size: 0.875rem;
          color: #718096;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }

        .dss-clear-search-button {
          padding: 0.75rem 1.5rem;
          background-color: #4F9CF9;
          color: white;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(79, 156, 249, 0.3);
        }

        .dss-clear-search-button:hover {
          background-color: #2B77E5;
          transform: translateY(-1px);
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .dss-container {
            padding: 0.5rem;
          }

          .dss-header {
            margin-bottom: 1.5rem;
          }

          .dss-header-content {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1rem;
          }

          .dss-header-icon-container {
            width: 3rem;
            height: 3rem;
          }

          .dss-title {
            font-size: 1.5rem;
          }

          .dss-subtitle {
            font-size: 0.875rem;
          }

          .dss-user-info {
            font-size: 0.75rem;
          }

          .dss-search-container {
            max-width: 100%;
          }

          .dss-search-input {
            font-size: 0.875rem;
            padding: 0.875rem 0.875rem 0.875rem 2.5rem;
          }

          .dss-card-header {
            padding: 1.5rem 1rem 1rem 1rem;
          }

          .dss-card-content {
            padding: 0 1rem 1.5rem 1rem;
          }

          .dss-card-title {
            font-size: 1.25rem;
          }

          .dss-project-card {
            padding: 1.25rem;
          }

          .dss-card-main-content {
            flex-direction: column;
            gap: 1rem;
          }

          .dss-right-section {
            align-self: stretch;
            min-width: auto;
          }

          .dss-score-container {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            min-width: auto;
          }

          .dss-score-circle {
            width: 4rem;
            height: 4rem;
            margin-bottom: 0;
            margin-right: 1rem;
          }

          .dss-score-value {
            font-size: 1.25rem;
          }

          .dss-progress-container {
            flex: 1;
            margin-bottom: 0;
            margin-right: 1rem;
          }

          .dss-project-title-row {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .dss-project-name {
            font-size: 1rem;
          }

          .dss-factor-badges {
            gap: 0.375rem;
          }

          .dss-factor-badge {
            font-size: 0.6875rem;
            padding: 0.25rem 0.5rem;
          }

          .dss-urgency-badge {
            margin-left: 0;
            margin-top: 0.25rem;
          }

          .dss-projects-list {
            max-height: none;
          }

          .dss-empty-search-state {
            padding: 2rem 1rem;
          }

          .dss-empty-search-icon {
            font-size: 2.5rem;
          }

          .dss-empty-search-title {
            font-size: 1.125rem;
          }
        }

        /* Small Mobile Styles */
        @media (max-width: 480px) {
          .dss-container {
            padding: 0.25rem;
          }

          .dss-header-content {
            padding: 0.75rem;
          }

          .dss-title {
            font-size: 1.25rem;
          }

          .dss-project-card {
            padding: 1rem;
          }

          .dss-score-container {
            flex-direction: column;
            text-align: center;
          }

          .dss-score-circle {
            margin-right: 0;
            margin-bottom: 0.5rem;
          }

          .dss-progress-container {
            margin-right: 0;
            margin-bottom: 0.5rem;
            width: 100%;
          }

          .dss-factor-badge {
            font-size: 0.625rem;
            padding: 0.25rem 0.375rem;
          }
        }

        /* Large Desktop Styles */
        @media (min-width: 1024px) {
          .dss-container {
            padding: 2rem;
          }

          .dss-header {
            margin-bottom: 3rem;
          }

          .dss-card-header {
            padding: 2.5rem 2.5rem 2rem 2.5rem;
          }

          .dss-card-content {
            padding: 0 2.5rem 2.5rem 2.5rem;
          }

          .dss-projects-list {
            max-height: 800px;
          }
        }
      `}</style>
    </Layout>
  )
}

export default DSS
