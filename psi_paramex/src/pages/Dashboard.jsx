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
import { Brain, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from "lucide-react"
import { API_ENDPOINTS, apiCall } from "../utils/api"

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

// Dynamic chart options based on time filter and data length
const getDynamicChartOptions = (timeFilter, dataLength) => {
  const baseOptions = {
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
          maxRotation: timeFilter === "all" ? 45 : 0, // Rotate labels for all time view
          minRotation: timeFilter === "all" ? 45 : 0,
          maxTicksLimit: timeFilter === "all" ? 12 : undefined, // Limit ticks for all time
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
  };

  return baseOptions;
};

// Specific options for earnings chart (without legend)
const getDynamicEarningsChartOptions = (timeFilter, dataLength) => {
  const baseOptions = getDynamicChartOptions(timeFilter, dataLength);
  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: false, // Hide legend for earnings chart
      },
    },
  };
};

// Specific options for Project Types Chart (with enhanced tooltip)
const getDynamicTypesChartOptions = (timeFilter, dataLength) => {
  const baseOptions = getDynamicChartOptions(timeFilter, dataLength);
  return {
    ...baseOptions,
    animation: {
      easing: 'easeInOutQuart', // Smoother easing
    },
    interaction: {
      intersect: false, // Better hover behavior
    },
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: false, // Hide legend since we show type names on x-axis
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
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
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales.x,
        ticks: {
          ...baseOptions.scales.x.ticks,
          maxRotation: 45, // Rotate labels if they're too long
          minRotation: 0,
        },
      },
    },
  };
};

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

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState("all")
  const [aiSummary, setAiSummary] = useState(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)

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
      
      // Generate AI summary after projects are loaded
      if (mappedProjects.length > 0) {
        await generateAISummary(mappedProjects, userId)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate AI Dashboard Summary
  const generateAISummary = async (projectsData, userId) => {
    setAiSummaryLoading(true)
    try {
      // Calculate key metrics for summary
      const totalProjects = projectsData.length
      const completedProjects = projectsData.filter(p => p.status === "Done").length
      const ongoingProjects = projectsData.filter(p => p.status === "On-Process" || p.status === "On-Plan").length
      const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
      const totalEarnings = projectsData.filter(p => p.status === "Done").reduce((sum, p) => sum + (p.payment_amount || 0), 0)
      const monthlyEarnings = projectsData
        .filter(p => {
          if (p.status !== "Done") return false;
          
          // Use deadline as the completion date for earnings calculation  
          const completionDate = new Date(p.deadline)
          const now = new Date()
          return completionDate.getMonth() === now.getMonth() && completionDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, p) => sum + (p.payment_amount || 0), 0)
      
      // Project types
      const typeDistribution = projectsData.reduce((acc, p) => {
        const type = p.project_type || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      
      const mostCommonType = Object.entries(typeDistribution).sort((a, b) => b[1] - a[1])[0]

      // Calculate earning potential
      const earningPotential = projectsData
        .filter(p => p.status === "On-Plan" || p.status === "On-Process")
        .reduce((sum, p) => sum + (p.payment_amount || 0), 0);

      // Call AI backend for simple summary
      try {
        const aiData = await apiCall(API_ENDPOINTS.dashboardSummary, {
          method: 'POST',
          body: JSON.stringify({
            user_id: userId,
            dashboard_data: {
              totalProjects,
              completedProjects,
              ongoingProjects,
              completionRate,
              totalEarnings,
              monthlyEarnings,
              earningPotential,
              mostCommonType: mostCommonType ? mostCommonType[0] : 'None'
            }
          })
        })
        
        setAiSummary({
          summary: aiData.summary,
          isSimple: true
        })
      } catch (error) {
        console.error("AI summary failed, using local summary:", error)
        // Fallback to local summary
        const localSummary = generateSimpleLocalSummary({
          totalProjects,
          completedProjects,
          ongoingProjects,
          completionRate,
          totalEarnings,
          monthlyEarnings,
          earningPotential,
          mostCommonType: mostCommonType ? mostCommonType[0] : 'None'
        })
        setAiSummary({
          summary: localSummary,
          isSimple: true
        })
      }
      
    } catch (error) {
      console.error("Error generating AI summary:", error)
      // Fallback to simple local summary
      const localSummary = generateSimpleLocalSummary({
        totalProjects: projectsData.length,
        completedProjects: projectsData.filter(p => p.status === "Done").length,
        ongoingProjects: projectsData.filter(p => p.status === "On-Process" || p.status === "On-Plan").length,
        completionRate: projectsData.length > 0 ? (projectsData.filter(p => p.status === "Done").length / projectsData.length) * 100 : 0,
        totalEarnings: projectsData.filter(p => p.status === "Done").reduce((sum, p) => sum + (p.payment_amount || 0), 0),
        monthlyEarnings: 0,
        earningPotential: projectsData.filter(p => p.status === "On-Plan" || p.status === "On-Process").reduce((sum, p) => sum + (p.payment_amount || 0), 0),
        mostCommonType: 'None'
      })
      setAiSummary({
        summary: localSummary,
        isSimple: true
      })
    } finally {
      setAiSummaryLoading(false)
    }
  }

  // Generate simple local summary
  const generateSimpleLocalSummary = (data) => {
    const { totalProjects, completedProjects, ongoingProjects, completionRate, totalEarnings, monthlyEarnings, earningPotential, mostCommonType } = data
    
    let summaryText = `Based on your dashboard data, you currently have ${totalProjects} total projects in your portfolio. `
    
    if (completedProjects > 0) {
      summaryText += `You've successfully completed ${completedProjects} projects, giving you a ${completionRate.toFixed(1)}% completion rate. `
    }
    
    if (ongoingProjects > 0) {
      summaryText += `Right now, you have ${ongoingProjects} active projects that need your attention. `
      if (earningPotential > 0) {
        summaryText += `These active projects have a potential earning value of $${earningPotential.toLocaleString()}. `
      }
    } else {
      summaryText += `You currently don't have any active projects - this might be a good time to look for new opportunities. `
    }
    
    if (totalEarnings > 0) {
      summaryText += `Your total earnings from all projects amount to $${totalEarnings.toLocaleString()}. `
      if (monthlyEarnings > 0) {
        summaryText += `This month, you've earned $${monthlyEarnings.toLocaleString()}. `
      }
    }
    
    if (mostCommonType && mostCommonType !== 'None') {
      summaryText += `Most of your projects are in the ${mostCommonType} category. `
    }
    
    summaryText += `This gives you a good overview of where your freelance business currently stands.`
    
    return summaryText
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
        if (p.status !== "Done") return false;
        
        // Use deadline as the completion date for earnings calculation
        const completionDate = new Date(p.deadline)
        return (
          completionDate.getMonth() === thisMonth.getMonth() &&
          completionDate.getFullYear() === thisMonth.getFullYear()
        )
      })
      .reduce((sum, p) => sum + (p.payment_amount || 0), 0)

    console.log("Monthly earnings:", monthlyEarnings)

    // Calculate earning potential from active projects
    const activeProjects = projects.filter(p => p.status === "On-Plan" || p.status === "On-Process");
    const earningPotential = activeProjects.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
    console.log("Earning potential:", earningPotential)

    return {
      totalProjects,
      onPlan,
      onProcess,
      done,
      totalEarnings,
      monthlyEarnings,
      earningPotential,
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

    // Monthly trends - Dynamic period based on filter
    let trendsPeriod, trendsMonths;
    
    if (timeFilter === "all") {
      // For "all time", calculate period from earliest project to now
      console.log('🔍 All projects for date analysis:', projects.map(p => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        start_date: p.start_date,
        deadline: p.deadline,
        status: p.status
      })));
      
      const earliestProject = projects.reduce((earliest, project) => {
        // Try multiple date fields to find the actual earliest date
        const createdDate = project.created_at ? new Date(project.created_at) : null;
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const deadlineDate = project.deadline ? new Date(project.deadline) : null;
        
        // Use the earliest available date from the project
        const projectDate = [createdDate, startDate, deadlineDate]
          .filter(date => date && !isNaN(date.getTime()))
          .sort((a, b) => a - b)[0];
        
        if (!projectDate) return earliest;
        
        console.log(`📅 Project ${project.name}:`, {
          created_at: createdDate?.toISOString(),
          start_date: startDate?.toISOString(),
          deadline: deadlineDate?.toISOString(),
          earliest_date: projectDate.toISOString()
        });
        
        return !earliest || projectDate < earliest ? projectDate : earliest;
      }, null);
      
      console.log('🎯 Final earliest project date:', earliestProject?.toISOString());
      
      if (earliestProject) {
        const startDate = new Date(earliestProject.getFullYear(), earliestProject.getMonth(), 1); // Start of earliest month
        const endDate = new Date(); // Current date
        
        // Calculate months from earliest to now
        const monthsFromEarliest = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
        trendsPeriod = Math.max(6, Math.min(monthsFromEarliest, 36)); // Increased max to 36 months for better coverage
        
        console.log('📅 All Time Range:', {
          earliestProject: earliestProject.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          monthsFromEarliest,
          trendsPeriod
        });
        
        // Create months array from earliest project to now
        trendsMonths = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate && trendsMonths.length < trendsPeriod) {
          trendsMonths.push({
            month: format(currentDate, "MMM yyyy"),
            date: new Date(currentDate),
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        console.log('📊 Trends months created:', trendsMonths.map(m => m.month).join(', '));
      } else {
        // Default if no projects - show last 6 months
        trendsPeriod = 6;
        trendsMonths = Array.from({ length: trendsPeriod }, (_, i) => {
          const date = subMonths(new Date(), trendsPeriod - 1 - i);
          return {
            month: format(date, "MMM yyyy"),
            date: date,
          };
        });
      }
    } else {
      // For specific time filters, show 3 months context
      trendsPeriod = 3;
      trendsMonths = Array.from({ length: trendsPeriod }, (_, i) => {
        const date = subMonths(new Date(), trendsPeriod - 1 - i);
        return {
          month: format(date, "MMM"),
          date: date,
        };
      });
    }

    // Get all unique types from filtered projects for trends
    const filteredUniqueTypes = [...new Set(filteredProjects.map(p => p.project_type).filter(Boolean))]
    
    console.log('Filtered projects count:', filteredProjects.length)
    console.log('Filtered unique types for trends:', filteredUniqueTypes)
    console.log('Trends period:', trendsPeriod, 'months')

    const monthlyTrendData = trendsMonths.map(({ month, date }) => {
      let monthProjects;
      
      if (timeFilter === "all") {
        // For "all time", use global projects with completion date logic
        monthProjects = projects.filter((project) => {
          if (project.status !== "Done") return false;
          
          // Use deadline as the completion date for trends calculation
          const completionDate = new Date(project.deadline)
          return isWithinInterval(completionDate, {
            start: startOfMonth(date),
            end: endOfMonth(date),
          })
        })
      } else {
        // For specific time filters, use filtered projects
        monthProjects = filteredProjects.filter((project) => {
          if (project.status !== "Done") return false;
          
          const completionDate = new Date(project.deadline)
          return isWithinInterval(completionDate, {
            start: startOfMonth(date),
            end: endOfMonth(date),
          })
        })
      }

      // Count completed projects by type
      const typeData = {}
      filteredUniqueTypes.forEach((typeName) => {
        typeData[typeName] = monthProjects.filter(
          (p) => p.project_type === typeName,
        ).length
      })

      return {
        month,
        ...typeData,
      }
    })

    const trendsData = {
      labels: monthlyTrendData.map((d) => d.month),
      datasets: filteredUniqueTypes.map((typeName, index) => ({
        label: typeName,
        data: monthlyTrendData.map((d) => d[typeName] || 0),
        borderColor: defaultColors[index % defaultColors.length],
        backgroundColor: `${defaultColors[index % defaultColors.length]}20`,
        tension: 0.4,
        fill: false,
      })),
    }

    // Monthly earnings data - Use same dynamic period as trends
    const earningsMonths = trendsMonths; // Use same period as trends
    const monthlyEarningsData = earningsMonths.map(({ month, date }) => {
      let monthProjects;
      
      if (timeFilter === "all") {
        // For "all time", use global projects
        monthProjects = projects.filter((project) => {
          if (project.status !== "Done") return false;
          
          // Use deadline as the completion date for earnings calculation
          const completionDate = new Date(project.deadline)
          return isWithinInterval(completionDate, {
            start: startOfMonth(date),
            end: endOfMonth(date),
          })
        })
      } else {
        // For specific time filters, use filtered projects
        monthProjects = filteredProjects.filter((project) => {
          if (project.status !== "Done") return false;
          
          const completionDate = new Date(project.deadline)
          return isWithinInterval(completionDate, {
            start: startOfMonth(date),
            end: endOfMonth(date),
          })
        })
      }

      return {
        month,
        earnings: monthProjects.reduce((sum, p) => sum + (p.payment_amount || 0), 0),
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
            <span className="text-black">Welcome back, {user?.user_metadata?.full_name || user?.email}!</span>
          </p>
        </div>

        {/* AI Summary */}
        <div className="mb-8">
          {aiSummaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-700">AI is analyzing your dashboard...</span>
            </div>
          ) : aiSummary ? (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-500 flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed text-sm">
                    {aiSummary.summary}
                  </p>
                </div>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-6 mb-6">
              <p className="text-gray-600">No projects found. Create your first project to get AI insights!</p>
            </div>
          ) : null}
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Projects */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Projects</span>
                <BarChart3Icon color="#3B82F6" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalProjects}</div>
            </div>
            
            {/* On-Plan */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">On-Plan</span>
                <ClockIcon color="#3B82F6" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{summary.onPlan}</div>
            </div>
            
            {/* On-Process */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">On-Process</span>
                <TrendingUpIcon color="#EAB308" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{summary.onProcess}</div>
            </div>
            
            {/* Done */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Done</span>
                <CheckCircleIcon color="#10B981" />
              </div>
              <div className="text-2xl font-bold text-green-600">{summary.done}</div>
            </div>
            
            {/* Earning Potential */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Earning Potential</span>
                <DollarSignIcon color="#10B981" />
              </div>
              <div className="text-xl font-bold text-green-600">${summary.earningPotential.toLocaleString()}</div>
            </div>
            
            {/* Total Earnings */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Earnings</span>
                <DollarSignIcon color="#10B981" />
              </div>
              <div className="text-xl font-bold text-green-600">${summary.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Success Rate */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Success Rate</span>
                <CheckCircleIcon color="#059669" />
              </div>
              <div className="text-2xl font-bold text-green-800 mb-1">
                {summary.totalProjects > 0 ? Math.round((summary.done / summary.totalProjects) * 100) : 0}%
              </div>
              <div className="text-xs text-green-700">
                {summary.done} of {summary.totalProjects} completed
              </div>
            </div>
            
            {/* Best Performing Type */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">Best Type</span>
                <TrendingUpIcon color="#EAB308" />
              </div>
              <div className="text-lg font-bold text-yellow-800 mb-1">
                {(() => {
                  const typeStats = projects.reduce((acc, p) => {
                    if (p.status === "Done") {
                      const type = p.project_type || "Unknown";
                      acc[type] = (acc[type] || 0) + (p.payment_amount || 0);
                    }
                    return acc;
                  }, {});
                  
                  const bestType = Object.entries(typeStats).reduce((a, b) => 
                    typeStats[a[0]] > typeStats[b[0]] ? a : b, ["No data", 0]
                  );
                  
                  return bestType[0] !== "No data" ? bestType[0] : "No data";
                })()}
              </div>
              <div className="text-xs text-yellow-700">
                Highest revenue type
              </div>
            </div>
            
            {/* Monthly Progress */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">This Month</span>
                <DollarSignIcon color="#2563EB" />
              </div>
              <div className="text-2xl font-bold text-blue-800 mb-1">
                ${summary.monthlyEarnings.toLocaleString()}
              </div>
              <div className="text-xs text-blue-700">
                Earned this month
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="mb-8">
          <div className="flex flex-row gap-4 items-center justify-between mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <FilterIcon />
              <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                  <Bar data={typesData} options={getDynamicTypesChartOptions(timeFilter, projects.length)} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">No projects in selected time period</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Trends Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Project Trends</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-2xl text-xs font-medium">
                  <FilterIcon />
                  <span>Filtered</span>
                </div>
              </div>
              <div className="h-64 relative">
                <Line data={trendsData} options={getDynamicChartOptions(timeFilter, projects.length)} />
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Monthly Earnings</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-2xl text-xs font-medium">
                  <FilterIcon />
                  <span>Filtered</span>
                </div>
              </div>
              <div className="h-64 relative">
                <Line data={earningsData} options={getDynamicEarningsChartOptions(timeFilter, projects.length)} />
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