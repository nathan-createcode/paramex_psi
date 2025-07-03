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

// // Project type mapping sesuai database
// const projectTypeMapping = {
//   1: "Website",
//   2: "Foto",
//   3: "Video",
//   4: "Game",
//   5: "Mobile Development",
// }


// const projectTypeColors = {
//   1: "#3B82F6", // Website - Blue
//   2: "#10B981", // Foto - Green
//   3: "#F59E0B", // Video - Yellow
//   4: "#8B5CF6", // Game - Purple
//   5: "#EF4444", // Mobile Development - Red
// }

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

// Specific options for Project Types Chart (with enhanced tooltip)
const typesChartOptions = {
  ...chartOptions,
  animation: {
    easing: 'easeInOutQuart', // Smoother easing
  },
  interaction: {
    intersect: false, // Better hover behavior
  },
  plugins: {
    ...chartOptions.plugins,
    legend: {
      display: false, // Hide legend since we show type names on x-axis
    },
    tooltip: {
      ...chartOptions.plugins.tooltip,
      callbacks: {
        label: (context) => {
          return `${context.label}: ${context.parsed.y} projects`;
        },
        afterBody: () => {
          return 'Filtered View: Shows only projects in selected time period';
        },
      },
    },
  },
  scales: {
    ...chartOptions.scales,
    x: {
      ...chartOptions.scales.x,
      ticks: {
        ...chartOptions.scales.x.ticks,
        maxRotation: 45, // Rotate labels if they're too long
        minRotation: 0,
      },
    },
  },
}

// Specific options for Earnings Chart (without legend)
const earningsChartOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    legend: {
      display: false, // Hide legend for earnings chart
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
        .select(`
          *,
          type_id:type_id ( type_name ),
          status_id:status_id ( status_name )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (projectsError) {
        console.error("Projects error:", projectsError)
        throw projectsError
      }

      // Map the data to include status from status_id relation
      const mappedProjects = (projectsData || []).map(project => ({
        ...project,
        status: project.status_id?.status_name || "unknown",
        project_type: project.type_id?.type_name || "unknown"
      }))

      console.log("Raw database projects:", projectsData)
      console.log("Mapped projects:", mappedProjects)
      // Debug: Check what statuses and types are in the database
      console.log("Project statuses:", mappedProjects?.map(p => p.status))
      console.log("Unique statuses:", [...new Set(mappedProjects?.map(p => p.status))])
      console.log("Project types:", mappedProjects?.map(p => p.project_type))
      console.log("Unique project types:", [...new Set(mappedProjects?.map(p => p.project_type))])
      
      setProjects(mappedProjects)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary data
  const summary = useMemo(() => {
    console.log("Calculating summary with projects:", projects.length)
    
    const totalProjects = projects.length
    const onPlan = projects.filter((p) => p.status === "On-Plan").length
    const onProcess = projects.filter((p) => p.status === "On-Process").length
    const done = projects.filter((p) => p.status === "Done").length
    
    console.log("Status counts:", { onPlan, onProcess, done })
    
          const doneProjects = projects.filter((p) => p.status === "Done")
    console.log("Done projects:", doneProjects)
    console.log("Done projects payment amounts:", doneProjects.map(p => p.payment_amount))
    
    const totalEarnings = doneProjects.reduce((sum, p) => sum + (p.payment_amount || 0), 0)
    console.log("Total earnings:", totalEarnings)

    // Calculate this month's earnings
    const thisMonth = new Date()
    const monthlyEarnings = projects
      .filter((p) => {
        const projectDate = new Date(p.created_at)
        return (
          p.status === "Done" &&
          projectDate.getMonth() === thisMonth.getMonth() &&
          projectDate.getFullYear() === thisMonth.getFullYear()
        )
      })
      .reduce((sum, p) => sum + (p.payment_amount || 0), 0)

    console.log("Monthly earnings:", monthlyEarnings)

    return {
      totalProjects,
      onPlan,
      onProcess,
      done,
      totalEarnings,
      monthlyEarnings,
    }
  }, [projects])

  // Filter projects by selected time filter
  const filteredProjects = useMemo(() => {
    if (timeFilter === "all") return projects;
  
    const monthsAgo = parseInt(timeFilter, 10);
    const targetMonth = subMonths(new Date(), monthsAgo);
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);
  
    console.log(`🕒 Filtering for: ${monthsAgo} month(s) ago`);
    console.log("Start of month:", start.toISOString());
    console.log("End of month:", end.toISOString());
  
    return projects.filter((project) => {
      const projectDate = new Date(project.start_date);
      return isWithinInterval(projectDate, { start, end });
    });
  }, [projects, timeFilter]);
  

  // Generate breakdown data for tooltip
  const statusBreakdownData = useMemo(() => {
    const statusMap = {
      "On-Plan": "On-Plan",
      "On-Process": "On-Process", 
      "Done": "Done",
    }

    const breakdown = {}

    Object.entries(statusMap).forEach(([displayName, statusKey]) => {
      const statusProjects = filteredProjects.filter((p) => p.status === statusKey)
      const typeBreakdown = {}

      statusProjects.forEach((project) => {
        const typeName = project.project_type || "Other"
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

  // Generate chart data - memoized for performance and reactive updates
  const chartData = useMemo(() => {
    // Status distribution data (filtered)
    const statusData = {
      labels: ["On-Plan", "On-Process", "Done"],
      datasets: [
        {
          data: [
            filteredProjects.filter((p) => p.status === "On-Plan").length,
            filteredProjects.filter((p) => p.status === "On-Process").length,
            filteredProjects.filter((p) => p.status === "Done").length,
          ],
                      backgroundColor: ["#3B82F6", "#EAB308", "#10B981"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }

    // Project types data (filtered) - Improved to maintain consistency
    const typeMap = new Map()
    
    // Process filtered projects and count by type
    filteredProjects.forEach((project) => {
      const typeName = project.project_type || "Unknown"
      const current = typeMap.get(typeName) || { count: 0, earnings: 0 }

      typeMap.set(typeName, {
        count: current.count + 1,
        earnings: current.earnings + ((project.status === "Done") ? project.payment_amount || 0 : 0),
      })
    })

    // Convert to array and filter out empty types (count > 0)
    const projectTypeData = Array.from(typeMap.entries())
      .map(([typeName, data]) => ({
        type: typeName,
        count: data.count,
        earnings: data.earnings,
      }))
      .filter(item => item.count > 0) // Only include types that have projects
      .sort((a, b) => b.count - a.count) // Sort by count descending for better UX

    console.log('Filtered projects count:', filteredProjects.length)
    console.log('Project type breakdown:', projectTypeData)

    // Create consistent colors for project types
    const defaultColors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280"]

    const typesData = {
      labels: projectTypeData.map(item => item.type),
      datasets: [{
        label: 'Projects',
        data: projectTypeData.map(item => item.count),
        backgroundColor: projectTypeData.map((_, index) => defaultColors[index % defaultColors.length]),
        borderRadius: 8,
        borderSkipped: false,
      }],
    }

    // Monthly trends (last 6 months) - Global
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        month: format(date, "MMM"),
        date: date,
      }
    })

    // Get all unique types from global projects for trends (global view)
    const allUniqueTypes = [...new Set(projects.map(p => p.project_type).filter(Boolean))]
    
    console.log('All projects count:', projects.length)
    console.log('All unique types for trends:', allUniqueTypes)

    const monthlyTrendData = last6Months.map(({ month, date }) => {
      const monthProjects = projects.filter((project) => {
        const projectDate = new Date(project.created_at)
        return isWithinInterval(projectDate, {
          start: startOfMonth(date),
          end: endOfMonth(date),
        })
      })

      // Count done projects by type
      const typeData = {}
      allUniqueTypes.forEach((typeName) => {
        typeData[typeName] = monthProjects.filter(
          (p) => p.project_type === typeName && p.status === "Done",
        ).length
      })

      return {
        month,
        ...typeData,
      }
    })

    const trendsData = {
      labels: monthlyTrendData.map((d) => d.month),
      datasets: allUniqueTypes.map((typeName, index) => ({
        label: typeName,
        data: monthlyTrendData.map((d) => d[typeName] || 0),
        borderColor: defaultColors[index % defaultColors.length],
        backgroundColor: `${defaultColors[index % defaultColors.length]}20`,
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

      const completedProjects = monthProjects.filter((p) => p.status === "Done")

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
  }, [filteredProjects, projects, timeFilter]) // Dependencies for useMemo

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 mt-4 bg-blue-500 text-white border-none rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      </Layout>
    )
  }

  const { statusData, typesData, trendsData, earningsData } = chartData

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Dynamic Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Welcome back, {user?.user_metadata?.full_name || user?.email}! You have{" "}
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg" >
              {summary.totalProjects} projects
            </span>
            ,{" "}
            <span className="font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
              {summary.onProcess} in progress
            </span>
            , and earned{" "}
            <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              ${summary.monthlyEarnings.toLocaleString()} this month
            </span>
            .
          </p>
        </div>

        {/* Summary Cards - 6 Cards seperti di gambar */}
        <div className="grid grid-cols-5 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 mb-8">
          {[
            {
              title: "Total Projects",
              value: summary.totalProjects.toString(),
              icon: BarChart3Icon,
              iconColor: "#3B82F6",
              bgColor: "bg-blue-50",
            },
            {
              title: "On-Plan",
              value: summary.onPlan.toString(),
              icon: ClockIcon,
              iconColor: "#3B82F6",
              bgColor: "bg-blue-50",
            },
            {
              title: "On-Process",
              value: summary.onProcess.toString(),
              icon: TrendingUpIcon,
              iconColor: "#EAB308",
              bgColor: "bg-yellow-50",
            },
            {
              title: "Done",
              value: summary.done.toString(),
              icon: CheckCircleIcon,
              iconColor: "#10B981",
              bgColor: "bg-green-50",
            },
            {
              title: "Total Earnings",
              value: `$${summary.totalEarnings.toLocaleString()}`,
              icon: DollarSignIcon,
              iconColor: "#10B981",
              bgColor: "bg-green-50",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-md/5 transition-all duration-200 border border-gray-100 cursor-default"
            > 
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${item.bgColor}`}>
                <item.icon color={item.iconColor} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{item.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Filtered Analytics Section */}
        <div className="mb-8">
          <div className="flex flex-row gap-4 items-center justify-between mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <FilterIcon />
              <h2 className="text-xl font-bold text-gray-900">Filtered Analytics</h2>
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm cursor-pointer outline-none"
            >
              <option value="all">All Time</option>
              <option value="0">This Month</option>
              <option value="1">Last Month</option>
              <option value="2">2 Months Ago</option>
              <option value="3">3 Months Ago</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Project Status</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-2xl text-xs font-medium">
                  <FilterIcon />
                  <span>Filtered</span>
                </div>
              </div>
              <div className="h-64 relative">
                <Doughnut data={statusData} options={doughnutOptions} />
              </div>
            </div>

            {/* Project Types Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Project Types</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-2xl text-xs font-medium">
                  <FilterIcon />
                  <span>Filtered</span>
                </div>
              </div>
              <div className="h-64 relative">
                {typesData.labels.length > 0 ? (
                  <Bar data={typesData} options={typesChartOptions} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">No projects in selected time period</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Performance Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <GlobeIcon />
            <h2 className="text-xl font-bold text-gray-900">Overall Performance</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Trends Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Project Trends</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-2xl text-xs font-medium">
                  <GlobeIcon />
                  <span>Global View</span>
                </div>
              </div>
              <div className="h-64 relative">
                <Line data={trendsData} options={chartOptions} />
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Monthly Earnings</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-2xl text-xs font-medium">
                  <GlobeIcon />
                  <span>Global View</span>
                </div>
              </div>
              <div className="h-64 relative">
                <Line data={earningsData} options={earningsChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-15 px-5 bg-white rounded-3xl shadow-md/5 border border-gray-100 mt-8">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-base text-gray-600 mb-6">
              Start by adding your first project to see analytics and insights here.
            </p>
            <button
              className="px-6 py-3 bg-blue-500 text-white border-none rounded-xl cursor-pointer text-base font-medium transition-all duration-200"
              onClick={() => navigate("/projects")}
            >
              Add Your First Project
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard