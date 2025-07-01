"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from "lucide-react"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const DSS = () => {
  const [expandedProjects, setExpandedProjects] = useState(new Set())
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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

  // Fetch projects from database
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)

        // Fetch projects with status not equal to "Done" (status_id !== 3)
        const { data, error } = await supabase
          .from("projects")
          .select(`
            *,
            project_status(status_name),
            project_type(type_name)
          `)
          .neq("status_id", 3) // Exclude projects with status "Done"
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

        setProjects(transformedProjects)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

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

  const projectsWithBadges = calculateBadges(projects)

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

  // Updated deadline category mapping based on database trigger
  const getDeadlineCategory = (score) => {
    switch (score) {
      case 5:
        return "Due Tomorrow"
      case 4:
        return "Urgent Deadline"
      case 3:
        return "Upcoming Deadline"
      case 2:
        return "On Track"
      case 1:
        return "Planned"
      default:
        return "Unknown"
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

  // Updated deadline badge style with 5-level color hierarchy
  const getDeadlineBadgeStyle = (deadlineScore) => {
    switch (deadlineScore) {
      case 5:
        // Due Tomorrow → Red
        return { backgroundColor: "#FEF2F2", color: "#F87171", border: "1px solid #FECACA" }
      case 4:
        // Urgent Deadline → Orange
        return { backgroundColor: "#FFF7ED", color: "#FDBA74", border: "1px solid #FED7AA" }
      case 3:
        // Upcoming Deadline → Amber
        return { backgroundColor: "#FFFBEB", color: "#FCD34D", border: "1px solid #FDE68A" }
      case 2:
        // On Track → Green
        return { backgroundColor: "#ECFDF5", color: "#34D399", border: "1px solid #A7F3D0" }
      case 1:
        // Planned → Blue
        return { backgroundColor: "#EFF6FF", color: "#60A5FA", border: "1px solid #BFDBFE" }
      default:
        return { backgroundColor: "#F7FAFC", color: "#718096", border: "1px solid #E2E8F0" }
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

  // Helper function to get deadline level name from score
  const getDeadlineLevelFromScore = (deadlineScore) => {
    switch (deadlineScore) {
      case 5:
        return "Due Tomorrow"
      case 4:
        return "Urgent"
      case 3:
        return "Upcoming"
      case 2:
        return "On Track"
      case 1:
        return "Planned"
      default:
        return "Unknown"
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
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.headerContent}>
              <div style={styles.headerIconContainer}>
                <TrendingUp size={40} color="#FFFFFF" style={styles.headerIcon} />
              </div>
              <div>
                <h1 style={styles.title}>
                  Project Prioritization <span style={styles.titleAccent}>DSS</span>
                </h1>
                <p style={styles.subtitle}>Loading projects...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* Enhanced Header Section */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerIconContainer}>
              <TrendingUp size={40} color="#FFFFFF" style={styles.headerIcon} />
            </div>
            <div>
              <h1 style={styles.title}>
                Project Prioritization <span style={styles.titleAccent}>DSS</span>
              </h1>
              <p style={styles.subtitle}>Prioritaskan proyek berdasarkan sistem skor terstruktur berbasis DSS</p>
            </div>
          </div>
        </div>

        {/* Search Bar Section */}
        <div style={styles.searchSection}>
          <div style={styles.searchContainer}>
            <div style={styles.searchIcon}>
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
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Priority Result Section */}
        <div style={styles.resultsCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardHeaderContent}>
              <h2 style={styles.cardTitle}>Priority Result</h2>
            </div>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.projectsList}>
              {filteredProjectsWithBadges.map((project, index) => (
                <div key={project.id} style={styles.projectCard}>
                  {/* Main Content Area - Split into Left and Right */}
                  <div style={styles.cardMainContent}>
                    {/* Left Side - Project Info */}
                    <div style={styles.leftSection}>
                      <div style={styles.projectHeader}>
                        <div style={styles.projectTitleRow}>
                          <span style={styles.projectNumber}>#{index + 1}</span>
                          <h3 style={styles.projectName}>{project.project_name}</h3>
                          {project.urgencyBadge && (
                            <div style={styles.urgencyBadge}>
                              <AlertTriangle size={12} color="#FDBA74" />
                              <span style={styles.urgencyBadgeText}>{project.urgencyBadge}</span>
                            </div>
                          )}
                        </div>
                        <p style={styles.clientName}>Client: {project.client_name}</p>
                      </div>

                      {/* Factor Badges with Updated Colors */}
                      <div style={styles.factorBadges}>
                        <span
                          style={{
                            ...styles.factorBadge,
                            ...getDeadlineBadgeStyle(project.deadline_score),
                          }}
                        >
                          Deadline: {getDeadlineLevelFromScore(project.deadline_score)} ({project.days_until_deadline}{" "}
                          days left)
                        </span>
                        <span
                          style={{
                            ...styles.factorBadge,
                            ...getPaymentBadgeStyle(project.payment_score),
                          }}
                        >
                          Payment: {getPaymentLevel(project.payment_score)} (${project.payment_amount.toLocaleString()})
                        </span>
                        <span
                          style={{
                            ...styles.factorBadge,
                            ...getDifficultyBadgeStyle(project.difficulty_level),
                          }}
                        >
                          Difficulty: {project.difficulty_level}
                        </span>
                      </div>

                      {/* Details Button */}
                      <div style={styles.detailsSection}>
                        <button style={styles.detailsButton} onClick={() => toggleExpanded(project.id)}>
                          <span>Details</span>
                          {expandedProjects.has(project.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Right Side - Enhanced Priority Score */}
                    <div style={styles.rightSection}>
                      <div style={styles.scoreContainer}>
                        <div style={styles.scoreCircle}>
                          <span style={styles.scoreValue}>{normalizeScore(project.priority_score)}</span>
                        </div>
                        <div style={styles.progressContainer}>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${normalizeScore(project.priority_score)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span style={styles.scoreLabel}>Priority Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Reasoning */}
                  {expandedProjects.has(project.id) && (
                    <div style={styles.reasoningSection}>
                      <p style={styles.reasoningText}>
                        Proyek {project.project_name} untuk klien {project.client_name} diprioritaskan karena memiliki
                        nilai Priority Score sebesar {normalizeScore(project.priority_score)}/100. Nilai ini didapat
                        dari kombinasi beberapa faktor:
                      </p>
                      <ul style={styles.reasoningList}>
                        <li>
                          Deadline: (batas waktu {project.days_until_deadline} hari lagi, kategori{" "}
                          {getDeadlineCategory(project.deadline_score)})
                        </li>
                        <li>
                          Payment: (nilai pembayaran ${project.payment_amount.toLocaleString()}, kategori{" "}
                          {getPaymentCategory(project.payment_score)})
                        </li>
                        <li>Difficulty: (tingkat kesulitan {project.difficulty_level})</li>
                      </ul>
                      <p style={styles.reasoningText}>
                        Dengan kombinasi nilai tersebut dan bobot masing-masing faktor, proyek ini menempati urutan
                        prioritas saat ini.
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {filteredProjectsWithBadges.length === 0 && searchQuery && (
                <div style={styles.emptySearchState}>
                  <div style={styles.emptySearchIcon}>🔍</div>
                  <h3 style={styles.emptySearchTitle}>Tidak ada proyek ditemukan</h3>
                  <p style={styles.emptySearchDescription}>
                    Tidak ada proyek yang cocok dengan pencarian "{searchQuery}". Coba gunakan kata kunci yang berbeda.
                  </p>
                  <button onClick={() => setSearchQuery("")} style={styles.clearSearchButton}>
                    Hapus Pencarian
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "40px",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "24px",
    background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)",
    borderRadius: "16px",
    boxShadow: "8px 8px 16px rgba(163, 177, 198, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.7)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
  },
  headerIconContainer: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #4F9CF9 0%, #2B77E5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
    flexShrink: 0,
  },
  headerIcon: {
    color: "#FFFFFF",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1A202C",
    margin: "0 0 8px 0",
  },
  titleAccent: {
    color: "#4F9CF9",
  },
  subtitle: {
    fontSize: "16px",
    fontWeight: "400",
    color: "#718096",
    margin: 0,
  },
  resultsCard: {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)",
    borderRadius: "20px",
    boxShadow: "12px 12px 24px rgba(163, 177, 198, 0.15), -12px -12px 24px rgba(255, 255, 255, 0.7)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "32px 32px 24px 32px",
  },
  cardHeaderContent: {
    padding: "20px",
    background: "linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)",
    borderRadius: "12px",
    boxShadow: "inset 2px 2px 6px rgba(163, 177, 198, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1A202C",
    margin: 0,
    textAlign: "center",
  },
  cardContent: {
    padding: "0 32px 32px 32px",
  },
  projectsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxHeight: "700px",
    overflowY: "auto",
  },
  projectCard: {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "8px 8px 16px rgba(163, 177, 198, 0.12), -8px -8px 16px rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
  },
  cardMainContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flex: 1,
    paddingRight: "24px",
  },
  rightSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "160px",
  },
  projectHeader: {
    marginBottom: "16px",
  },
  projectTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
    flexWrap: "nowrap",
  },
  projectNumber: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#718096",
    background: "linear-gradient(135deg, #F7F9FC 0%, #EEF4FF 100%)",
    padding: "6px 10px",
    borderRadius: "8px",
    flexShrink: 0,
    boxShadow: "2px 2px 4px rgba(163, 177, 198, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.8)",
  },
  projectName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1A202C",
    margin: 0,
    flexShrink: 0,
  },
  urgencyBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#FFF7ED",
    padding: "4px 8px",
    borderRadius: "8px",
    border: "1px solid #FED7AA",
    flexShrink: 0,
    marginLeft: "8px",
  },
  urgencyBadgeText: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#FDBA74",
    whiteSpace: "nowrap",
  },
  clientName: {
    fontSize: "14px",
    fontWeight: "400",
    color: "#718096",
    margin: 0,
  },
  factorBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  factorBadge: {
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "500",
    boxShadow: "2px 2px 4px rgba(163, 177, 198, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.8)",
  },
  detailsSection: {
    display: "flex",
    justifyContent: "flex-start",
  },
  detailsButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)",
    border: "1px solid rgba(79, 156, 249, 0.2)",
    color: "#4F9CF9",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "10px",
    transition: "all 0.2s ease",
    boxShadow: "4px 4px 8px rgba(163, 177, 198, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8)",
  },
  scoreContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)",
    borderRadius: "16px",
    boxShadow: "inset 2px 2px 6px rgba(163, 177, 198, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
    minWidth: "140px",
  },
  scoreCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4F9CF9 0%, #2B77E5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
    boxShadow: "0 4px 12px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
  },
  scoreValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#FFFFFF",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  progressContainer: {
    width: "100px",
    marginBottom: "8px",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#E2E8F0",
    borderRadius: "4px",
    overflow: "hidden",
    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #4F9CF9 0%, #2B77E5 50%, #1E5FCC 100%)",
    borderRadius: "4px",
    transition: "width 0.3s ease",
    boxShadow: "0 1px 2px rgba(79, 156, 249, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  scoreLabel: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#718096",
  },
  reasoningSection: {
    marginTop: "20px",
    padding: "20px",
    background: "linear-gradient(135deg, #F7F9FC 0%, #EEF4FF 100%)",
    borderRadius: "12px",
    boxShadow: "inset 2px 2px 6px rgba(163, 177, 198, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
  },
  reasoningText: {
    fontSize: "14px",
    fontWeight: "400",
    color: "#1A202C",
    lineHeight: "1.6",
    margin: "0 0 12px 0",
  },
  reasoningList: {
    fontSize: "14px",
    fontWeight: "400",
    color: "#1A202C",
    lineHeight: "1.6",
    margin: "12px 0",
    paddingLeft: "20px",
  },
  searchSection: {
    marginBottom: "24px",
  },
  searchContainer: {
    position: "relative",
    maxWidth: "500px",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  },
  searchInput: {
    width: "100%",
    padding: "16px 16px 16px 48px",
    fontSize: "16px",
    fontWeight: "400",
    color: "#374151",
    backgroundColor: "white",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    outline: "none",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  clearButton: {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
  },
  emptySearchState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "8px 8px 16px rgba(163, 177, 198, 0.12), -8px -8px 16px rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(79, 156, 249, 0.1)",
  },
  emptySearchIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptySearchTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1A202C",
    margin: "0 0 8px 0",
  },
  emptySearchDescription: {
    fontSize: "14px",
    color: "#718096",
    margin: "0 0 24px 0",
    lineHeight: "1.5",
  },
  clearSearchButton: {
    padding: "12px 24px",
    backgroundColor: "#4F9CF9",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(79, 156, 249, 0.3)",
  },
}

export default DSS