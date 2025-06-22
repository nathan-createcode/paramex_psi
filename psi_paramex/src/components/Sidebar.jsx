"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import { useState, useEffect } from "react"
import {
  Settings,
  BadgeHelp,
  LayoutDashboard,
  ClipboardCheck,
  BrainCircuit,
  BotMessageSquare,
  ChevronLeft,
  LogOut,
} from "lucide-react"

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState(null)

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Project",
      href: "/projects",
      icon: ClipboardCheck,
    },
    {
      name: "DSS & AI",
      href: "/dss",
      icon: BrainCircuit,
    },
    {
      name: "Project Advisor",
      href: "/project-advisor",
      icon: BotMessageSquare,
    },
  ]

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error("Error getting user:", error)
      }
    }
    getUser()
  }, [])

  // Helper function to get user initials
  const getUserInitials = (user) => {
    if (!user) return "U"

    const fullName = user.user_metadata?.full_name
    if (fullName) {
      const names = fullName.trim().split(" ")
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    // Fallback to email
    if (user.email) {
      return user.email[0].toUpperCase()
    }

    return "U"
  }

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (!user) return "User"
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  }

  const secondaryItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      description: "App preferences, theme, notifications",
    },
    {
      name: "Help",
      href: "/help",
      icon: BadgeHelp,
      description: "Documentation, support, tutorials",
    },
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isActive = (href) => location.pathname === href

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: open ? "280px" : "80px",
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <img src="/src/assets/logo.png" alt="logo" width="32" height="32" style={styles.logoImage} />
            </div>
            {open && <h1 style={styles.logoText}>Flowtica</h1>}
          </div>
          <button
            onClick={() => setOpen(!open)}
            style={styles.toggleButton}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronLeft
              size={20}
              color="#6B7280"
              style={{
                transform: open ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.3s",
              }}
            />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navSection}>
          {open && (
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>MAIN MENU</h2>
            </div>
          )}
          {navItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                style={{
                  ...styles.navItem,
                  ...(isActive(item.href) ? styles.navItemActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = "#F3F4F6"
                    e.target.style.color = "#374151"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = "transparent"
                    e.target.style.color = "#6B7280"
                  }
                }}
                title={!open ? item.name : undefined}
              >
                <IconComponent size={20} color={isActive(item.href) ? "#3B82F6" : "currentColor"} />
                {open && <span style={styles.navItemText}>{item.name}</span>}
              </button>
            )
          })}
        </div>

        {/* Secondary Navigation */}
        <div style={styles.navSection}>
          {open && (
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>OTHER</h2>
            </div>
          )}
          {secondaryItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                style={{
                  ...styles.navItem,
                  ...(isActive(item.href) ? styles.navItemActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = "#F3F4F6"
                    e.target.style.color = "#374151"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = "transparent"
                    e.target.style.color = "#6B7280"
                  }
                }}
                title={!open ? item.name : item.description}
              >
                <IconComponent size={20} color={isActive(item.href) ? "#3B82F6" : "currentColor"} />
                {open && (
                  <div style={styles.navItemContent}>
                    <span style={styles.navItemText}>{item.name}</span>
                    <span style={styles.navItemDescription}>{item.description}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* User Info Card */}
        {open && (
          <div style={styles.userSection}>
            <div style={styles.userCard}>
              <div style={styles.userInfo}>
                <div style={styles.userAvatar}>
                  <span style={styles.userInitials}>{getUserInitials(user)}</span>
                </div>
                <div style={styles.userDetails}>
                  <p style={styles.userName}>{getDisplayName(user)}</p>
                  <p style={styles.userRole}>Freelance Developer</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div style={styles.logoutSection}>
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
          title={!open ? "Logout" : undefined}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#FEE2E2"
            e.target.style.borderColor = "#FCA5A5"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#FEF2F2"
            e.target.style.borderColor = "#FECACA"
          }}
        >
          <LogOut size={20} color="#EF4444" />
          {open && <span style={styles.logoutText}>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    backgroundColor: "white",
    borderRight: "1px solid #E5E7EB",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease-in-out",
    zIndex: 50,
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  header: {
    height: "64px",
    padding: "16px",
    borderBottom: "1px solid #F3F4F6",
    display: "flex",
    alignItems: "center",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    padding: "8px",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1F2937",
    margin: 0,
  },
  toggleButton: {
    padding: "8px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },
  nav: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    overflowY: "auto",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sectionHeader: {
    padding: "12px",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: 0,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#6B7280",
    transition: "all 0.2s ease-in-out",
    textAlign: "left",
    width: "100%",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  navItemActive: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #DBEAFE",
    boxShadow: "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)",
  },
  navItemText: {
    flex: 1,
  },
  navItemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  navItemDescription: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  userSection: {
    paddingTop: "24px",
  },
  userCard: {
    background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitials: {
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1F2937",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: "12px",
    color: "#6B7280",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutSection: {
    padding: "16px",
    borderTop: "1px solid #F3F4F6",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #FECACA",
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease-in-out",
    width: "100%",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  logoutText: {
    color: "#B91C1C",
  },
}

export default Sidebar
