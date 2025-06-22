"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

// Register Chart.js components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
)

// Project type mapping sesuai database
const projectTypeMapping = {
  1: "Website",
  2: "Foto",
  3: "Video",
  4: "Game",
  5: "Mobile Development",
}

const projectTypeColors = {
  1: "#3B82F6", // Website - Blue
  2: "#10B981", // Foto - Green
  3: "#F59E0B", // Video - Yellow
  4: "#8B5CF6", // Game - Purple
  5: "#EF4444", // Mobile Development - Red
}

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "white",
      bodyColor: "white",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
}

// Icon Components dengan warna
const BarChart3Icon = ({ color = "#3B82F6" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
)

const ClockIcon = ({ color = "#3B82F6" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
)

const TrendingUpIcon = ({ color = "#EAB308" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
    <polyline points="16,7 22,7 22,13" />
  </svg>
)

const MessageSquareIcon = ({ color = "#A855F7" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const CheckCircleIcon = ({ color = "#10B981" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
)

const DollarSignIcon = ({ color = "#10B981" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState("all")
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

        setUser(session.user)
        await fetchData(session.user.id)
      } catch (error) {
        console.error("Auth error:", error)
        navigate("/login")
      }
    }

    checkAuth()
  }, [navigate])

  // Fetch data from Supabase
  const fetchData = async (userId) => {
    try {
      setLoading(true)

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (projectsError) {
        console.error("Projects error:", projectsError)
        throw projectsError
      }

      console.log("Fetched projects:", projectsData)
      setProjects(projectsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary data
  const summary = useMemo(() => {
    const totalProjects = projects.length
    const onPlan = projects.filter((p) => p.status === "on-plan").length
    const onProcess = projects.filter((p) => p.status === "on-process").length
    const onDiscuss = projects.filter((p) => p.status === "on-discuss").length
    const completed = projects.filter((p) => p.status === "done").length
    const totalEarnings = projects
      .filter((p) => p.status === "done")
      .reduce((sum, p) => sum + (p.payment_amount || 0), 0)

    // Calculate this month's earnings
    const thisMonth = new Date()
    const monthlyEarnings = projects
      .filter((p) => {
        const projectDate = new Date(p.created_at)
        return (
          p.status === "done" &&
          projectDate.getMonth() === thisMonth.getMonth() &&
          projectDate.getFullYear() === thisMonth.getFullYear()
        )
      })
      .reduce((sum, p) => sum + (p.payment_amount || 0), 0)

    return {
      totalProjects,
      onPlan,
      onProcess,
      onDiscuss,
      completed,
      totalEarnings,
      monthlyEarnings,
    }
  }, [projects])

  // Filter projects by selected time filter
  const filteredProjects = useMemo(() => {
    if (timeFilter === "all") return projects

    const monthsAgo = Number.parseInt(timeFilter)
    const filterDate = new Date()
    filterDate.setMonth(filterDate.getMonth() - monthsAgo)
    const startOfFilterMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1)
    const endOfFilterMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0)

    return projects.filter((project) => {
      const projectDate = new Date(project.created_at)
      return projectDate >= startOfFilterMonth && projectDate <= endOfFilterMonth
    })
  }, [projects, timeFilter])

  // Generate breakdown data for tooltip
  const statusBreakdownData = useMemo(() => {
    const statusMap = {
      "On-Plan": "on-plan",
      "On-Process": "on-process",
      "On-Discuss": "on-discuss",
      Done: "done",
    }

    const breakdown = {}

    Object.entries(statusMap).forEach(([displayName, statusKey]) => {
      const statusProjects = filteredProjects.filter((p) => p.status === statusKey)
      const typeBreakdown = {}

      statusProjects.forEach((project) => {
        const typeName = projectTypeMapping[project.project_type] || "Other"
        typeBreakdown[typeName] = (typeBreakdown[typeName] || 0) + 1
      })

      breakdown[displayName] = typeBreakdown
    })

    return breakdown
  }, [filteredProjects])

  // Create doughnut options with proper tooltip callback
  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            afterBody: (context) => {
              const statusName = context[0].label
              const typeBreakdown = statusBreakdownData[statusName] || {}

              const breakdown = Object.entries(typeBreakdown)
                .map(([type, count]) => `${type}: ${count}`)
                .join("\n")

              return breakdown ? `\nBreakdown:\n${breakdown}` : ""
            },
          },
        },
      },
      cutout: "60%",
    }),
    [statusBreakdownData],
  )

  // Generate chart data
  const generateChartData = () => {
    // Status distribution data (filtered)
    const statusData = {
      labels: ["On-Plan", "On-Process", "On-Discuss", "Done"],
      datasets: [
        {
          data: [
            filteredProjects.filter((p) => p.status === "on-plan").length,
            filteredProjects.filter((p) => p.status === "on-process").length,
            filteredProjects.filter((p) => p.status === "on-discuss").length,
            filteredProjects.filter((p) => p.status === "done").length,
          ],
          backgroundColor: ["#3B82F6", "#EAB308", "#A855F7", "#10B981"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }

    // Project types data (filtered)
    const typeMap = new Map()
    Object.keys(projectTypeMapping).forEach((typeId) => {
      typeMap.set(Number.parseInt(typeId), { count: 0, earnings: 0 })
    })

    filteredProjects.forEach((project) => {
      const typeId = Number.parseInt(project.project_type) || 1
      const current = typeMap.get(typeId) || { count: 0, earnings: 0 }

      typeMap.set(typeId, {
        count: current.count + 1,
        earnings: current.earnings + (project.status === "done" ? project.payment_amount || 0 : 0),
      })
    })

    const projectTypeData = Array.from(typeMap.entries()).map(([typeId, data]) => ({
      type: projectTypeMapping[typeId],
      count: data.count,
      earnings: data.earnings,
    }))

    const typesData = {
      labels: projectTypeData.map((d) => d.type),
      datasets: [
        {
          label: "Projects Count",
          data: projectTypeData.map((d) => d.count),
          backgroundColor: Object.values(projectTypeColors),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }

    // Monthly trends (last 6 months) - Global
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        month: format(date, "MMM"),
        date: date,
      }
    })

    const monthlyTrendData = last6Months.map(({ month, date }) => {
      const monthProjects = projects.filter((project) => {
        const projectDate = new Date(project.created_at)
        return isWithinInterval(projectDate, {
          start: startOfMonth(date),
          end: endOfMonth(date),
        })
      })

      // Count completed projects by type
      const typeData = {}
      Object.keys(projectTypeMapping).forEach((typeId) => {
        typeData[typeId] = monthProjects.filter(
          (p) => Number.parseInt(p.project_type) === Number.parseInt(typeId) && p.status === "done",
        ).length
      })

      return {
        month,
        ...typeData,
      }
    })

    const trendsData = {
      labels: monthlyTrendData.map((d) => d.month),
      datasets: Object.keys(projectTypeMapping).map((typeId) => ({
        label: projectTypeMapping[typeId],
        data: monthlyTrendData.map((d) => d[typeId] || 0),
        borderColor: projectTypeColors[typeId],
        backgroundColor: `${projectTypeColors[typeId]}20`,
        tension: 0.4,
        fill: false,
      })),
    }

    // Monthly earnings data (global)
    const monthlyEarningsData = last6Months.map(({ month, date }) => {
      const monthProjects = projects.filter((project) => {
        const projectDate = new Date(project.created_at)
        return isWithinInterval(projectDate, {
          start: startOfMonth(date),
          end: endOfMonth(date),
        })
      })

      const completedProjects = monthProjects.filter((p) => p.status === "done")

      return {
        month,
        earnings: completedProjects.reduce((sum, p) => sum + (p.payment_amount || 0), 0),
      }
    })

    const earningsData = {
      labels: monthlyEarningsData.map((d) => d.month),
      datasets: [
        {
          label: "Earnings ($)",
          data: monthlyEarningsData.map((d) => d.earnings),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    }

    return { statusData, typesData, trendsData, earningsData }
  }

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div style={styles.errorContainer}>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </Layout>
    )
  }

  const { statusData, typesData, trendsData, earningsData } = generateChartData()

  return (
    <Layout>
      <div style={styles.container}>
        {/* Dynamic Welcome Header */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.title}>Dashboard Overview</h1>
          <p style={styles.subtitle}>
            Welcome back, {user?.user_metadata?.full_name || user?.email}! You have{" "}
            <span style={styles.highlight}>{summary.totalProjects} projects</span>,{" "}
            <span style={styles.highlightYellow}>{summary.onProcess} in progress</span>, and earned{" "}
            <span style={styles.highlightGreen}>${summary.monthlyEarnings.toLocaleString()} this month</span>.
          </p>
        </div>

        {/* Summary Cards - 6 Cards seperti di gambar */}
        <div style={styles.summaryGrid} className="dashboard-summary-grid">
          {[
            {
              title: "Total Projects",
              value: summary.totalProjects.toString(),
              icon: BarChart3Icon,
              iconColor: "#3B82F6",
              bgColor: "rgba(59, 130, 246, 0.1)",
            },
            {
              title: "On-Plan",
              value: summary.onPlan.toString(),
              icon: ClockIcon,
              iconColor: "#3B82F6",
              bgColor: "rgba(59, 130, 246, 0.1)",
            },
            {
              title: "On-Process",
              value: summary.onProcess.toString(),
              icon: TrendingUpIcon,
              iconColor: "#EAB308",
              bgColor: "rgba(234, 179, 8, 0.1)",
            },
            {
              title: "On-Discuss",
              value: summary.onDiscuss.toString(),
              icon: MessageSquareIcon,
              iconColor: "#A855F7",
              bgColor: "rgba(168, 85, 247, 0.1)",
            },
            {
              title: "Completed",
              value: summary.completed.toString(),
              icon: CheckCircleIcon,
              iconColor: "#10B981",
              bgColor: "rgba(16, 185, 129, 0.1)",
            },
            {
              title: "Total Earnings",
              value: `$${summary.totalEarnings.toLocaleString()}`,
              icon: DollarSignIcon,
              iconColor: "#10B981",
              bgColor: "rgba(16, 185, 129, 0.1)",
            },
          ].map((item, index) => (
            <div key={index} style={styles.summaryCard}>
              <div style={{ ...styles.cardIcon, backgroundColor: item.bgColor }}>
                <item.icon color={item.iconColor} />
              </div>
              <div style={styles.cardContent}>
                <p style={styles.cardTitle}>{item.title}</p>
                <h3 style={styles.cardValue}>{item.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Filtered Analytics Section */}
        <div style={styles.analyticsSection}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitleContainer}>
              <FilterIcon />
              <h2 style={styles.sectionTitle}>Filtered Analytics</h2>
            </div>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">All Time</option>
              <option value="0">This Month</option>
              <option value="1">Last Month</option>
              <option value="2">2 Months Ago</option>
              <option value="3">3 Months Ago</option>
            </select>
          </div>

          <div style={styles.chartsGrid}>
            {/* Project Status Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Project Status</h3>
                <div style={styles.filteredBadge}>
                  <FilterIcon />
                  <span>Filtered</span>
                </div>
              </div>
              <div style={styles.chartContainer}>
                <Doughnut data={statusData} options={doughnutOptions} />
              </div>
            </div>

            {/* Project Types Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Project Types</h3>
                <div style={styles.filteredBadge}>
                  <FilterIcon />
                  <span>Filtered</span>
                </div>
              </div>
              <div style={styles.chartContainer}>
                <Bar data={typesData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Overall Performance Section */}
        <div style={styles.performanceSection}>
          <div style={styles.sectionTitleContainer}>
            <GlobeIcon />
            <h2 style={styles.sectionTitle}>Overall Performance</h2>
          </div>

          <div style={styles.chartsGrid}>
            {/* Project Trends Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Project Trends</h3>
                <div style={styles.globalBadge}>
                  <GlobeIcon />
                  <span>Global View</span>
                </div>
              </div>
              <div style={styles.chartContainer}>
                <Line data={trendsData} options={chartOptions} />
              </div>
            </div>

            {/* Earnings Chart */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>Monthly Earnings</h3>
                <div style={styles.globalBadge}>
                  <GlobeIcon />
                  <span>Global View</span>
                </div>
              </div>
              <div style={styles.chartContainer}>
                <Line data={earningsData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <h3 style={styles.emptyTitle}>No Projects Yet</h3>
            <p style={styles.emptyDescription}>
              Start by adding your first project to see analytics and insights here.
            </p>
            <button style={styles.addButton} onClick={() => navigate("/projects")}>
              Add Your First Project
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

// Styles object - Menghapus media queries dari inline styles
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "24px",
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
  },
  welcomeSection: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "30px",
    fontWeight: "bold",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "18px",
    color: "#6b7280",
    margin: 0,
    lineHeight: "1.6",
  },
  highlight: {
    fontWeight: "bold",
    color: "#2563eb",
    backgroundColor: "#dbeafe",
    padding: "4px 8px",
    borderRadius: "8px",
  },
  highlightYellow: {
    fontWeight: "bold",
    color: "#d97706",
    backgroundColor: "#fef3c7",
    padding: "4px 8px",
    borderRadius: "8px",
  },
  highlightGreen: {
    fontWeight: "bold",
    color: "#059669",
    backgroundColor: "#d1fae5",
    padding: "4px 8px",
    borderRadius: "8px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)", // Paksa 6 kolom
    gap: "16px", // Kurangi gap agar muat
    marginBottom: "32px",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s",
    border: "none",
    cursor: "default",
  },
  cardIcon: {
    height: "48px",
    width: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  cardValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#111827",
    margin: 0,
  },
  analyticsSection: {
    marginBottom: "32px",
  },
  sectionHeader: {
    display: "flex",
    flexDirection: "row",
    gap: "16px",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  sectionTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#111827",
    margin: 0,
  },
  filterSelect: {
    padding: "8px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    backgroundColor: "white",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
  },
  performanceSection: {
    marginBottom: "32px",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
    gap: "24px",
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    border: "none",
    position: "relative",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  chartTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#111827",
    margin: 0,
  },
  filteredBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  globalBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  chartContainer: {
    height: "256px",
    position: "relative",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    marginTop: "32px",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  emptyDescription: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 24px 0",
  },
  addButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
}

// Update CSS stylesheet untuk responsive
const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 1200px) {
    .dashboard-summary-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }

  @media (max-width: 768px) {
    .dashboard-charts-grid {
      grid-template-columns: 1fr !important;
    }
    .dashboard-summary-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .dashboard-section-header {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
  }

  @media (max-width: 480px) {
    .dashboard-summary-grid {
      grid-template-columns: 1fr !important;
    }
  }
`
document.head.appendChild(styleSheet)

export default Dashboard
