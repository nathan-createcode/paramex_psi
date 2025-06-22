"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const navigate = useNavigate()

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
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter projects based on search and filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "on-plan":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#DBEAFE" }
      case "on-process":
        return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" }
      case "on-discuss":
        return { bg: "#F3E8FF", text: "#7C3AED", border: "#E9D5FF" }
      case "done":
        return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" }
      default:
        return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" }
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" }
      case "medium":
        return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" }
      case "low":
        return { bg: "#EFF6FF", text: "#2563EB", border: "#DBEAFE" }
      default:
        return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" }
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading projects...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div style={styles.errorContainer}>
          <h2>Error Loading Projects</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Project Management</h1>
            <p style={styles.subtitle}>Manage and track all your freelance projects</p>
          </div>
          <button style={styles.addButton}>
            <PlusIcon />
            Add Project
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filtersContainer}>
          <div style={styles.searchContainer}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">All Status</option>
              <option value="on-plan">On-Plan</option>
              <option value="on-process">On-Process</option>
              <option value="on-discuss">On-Discuss</option>
              <option value="done">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderCell}>Project Name</div>
              <div style={styles.tableHeaderCell}>Client</div>
              <div style={styles.tableHeaderCell}>Status</div>
              <div style={styles.tableHeaderCell}>Deadline</div>
              <div style={styles.tableHeaderCell}>Payment</div>
              <div style={styles.tableHeaderCell}>Priority</div>
              <div style={styles.tableHeaderCell}>Actions</div>
            </div>

            {filteredProjects.length === 0 ? (
              <div style={styles.emptyState}>
                <ProjectIcon />
                <h3 style={styles.emptyTitle}>No projects found</h3>
                <p style={styles.emptyDescription}>
                  {projects.length === 0
                    ? "Get started by creating your first project"
                    : "Try adjusting your search or filter criteria"}
                </p>
                {projects.length === 0 && <button style={styles.emptyButton}>Create Project</button>}
              </div>
            ) : (
              <div style={styles.tableBody}>
                {filteredProjects.map((project) => {
                  const statusColor = getStatusColor(project.status)
                  const priorityColor = getPriorityColor(project.priority)

                  return (
                    <div key={project.id} style={styles.tableRow}>
                      <div style={styles.tableCell}>
                        <div style={styles.projectName}>{project.name}</div>
                      </div>
                      <div style={styles.tableCell}>{project.client}</div>
                      <div style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                          }}
                        >
                          {project.status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                      <div style={styles.tableCell}>{new Date(project.deadline).toLocaleDateString()}</div>
                      <div style={styles.tableCell}>${project.payment?.toLocaleString() || "0"}</div>
                      <div style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.priorityBadge,
                            backgroundColor: priorityColor.bg,
                            color: priorityColor.text,
                            border: `1px solid ${priorityColor.border}`,
                          }}
                        >
                          {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                        </span>
                      </div>
                      <div style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button style={styles.actionButton} title="View Details">
                            <EyeIcon />
                          </button>
                          <button style={styles.actionButton} title="Edit Project">
                            <EditIcon />
                          </button>
                          <button style={styles.actionButton} title="Delete Project">
                            <DeleteIcon />
                          </button>
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
    </Layout>
  )
}

// Icon Components - FIXED
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6B7280"
    strokeWidth="2"
    style={{
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
    }}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
)

const ProjectIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

// FIXED STYLES - Menghapus semua konflik dengan Layout
const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
    // REMOVED: minHeight, backgroundColor, padding yang bertabrakan dengan Layout
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
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
    textAlign: "center",
  },
  retryButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "16px",
    // REMOVED: boxShadow yang berlebihan
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
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
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    // REMOVED: boxShadow yang berlebihan
  },
  filtersContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  searchContainer: {
    position: "relative",
    flex: 1,
    maxWidth: "400px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 44px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    outline: "none",
    // REMOVED: boxShadow yang berlebihan
  },
  filterGroup: {
    display: "flex",
    gap: "12px",
  },
  filterSelect: {
    padding: "12px 16px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
    // REMOVED: boxShadow yang berlebihan
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #E5E7EB",
    // REMOVED: boxShadow yang berlebihan
  },
  tableCard: {
    width: "100%",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
    gap: "16px",
    padding: "20px 24px",
    backgroundColor: "#F9FAFB",
    borderBottom: "1px solid #E5E7EB",
  },
  tableHeaderCell: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableBody: {
    display: "flex",
    flexDirection: "column",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
    gap: "16px",
    padding: "20px 24px",
    borderBottom: "1px solid #F3F4F6",
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
  tableCell: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#374151",
  },
  projectName: {
    fontWeight: "500",
    color: "#1F2937",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    textAlign: "center",
  },
  priorityBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    textAlign: "center",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    padding: "8px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "#6B7280",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
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
    margin: "0 0 24px 0",
    maxWidth: "400px",
  },
  emptyButton: {
    padding: "12px 24px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    // REMOVED: boxShadow yang berlebihan
  },
}

// Add CSS animation for spinner
const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(styleSheet)

export default Projects
