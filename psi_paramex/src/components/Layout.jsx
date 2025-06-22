"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import AccountSettingsModal from "../pages/AccountSettingsModal"

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)

  // Don't show layout for login/register/landing pages
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/"

  // Listen for account settings modal events from Header
  useEffect(() => {
    const handleOpenAccountSettings = () => {
      setAccountSettingsOpen(true)
    }

    // Add event listener for custom events from Header
    window.addEventListener("openAccountSettings", handleOpenAccountSettings)

    return () => {
      window.removeEventListener("openAccountSettings", handleOpenAccountSettings)
    }
  }, [])

  // Handle URL-based modal opening
  useEffect(() => {
    if (location.pathname === "/account-settings") {
      setAccountSettingsOpen(true)
    }
  }, [location.pathname])

  const handleCloseAccountSettings = () => {
    setAccountSettingsOpen(false)
    // Navigate back if we came from direct URL
    if (location.pathname === "/account-settings") {
      navigate("/dashboard") // Navigate to dashboard instead of going back
    }
  }

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div style={styles.container}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div
        style={{
          ...styles.mainContent,
          marginLeft: sidebarOpen ? "280px" : "80px",
        }}
      >
        <Header />
        <main style={styles.content}>{children}</main>
      </div>

      {/* Account Settings Modal */}
      <AccountSettingsModal isOpen={accountSettingsOpen} onClose={handleCloseAccountSettings} />
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    transition: "margin-left 0.3s ease-in-out",
    minWidth: 0, // Prevent flex item from overflowing
  },
  content: {
    flex: 1,
    padding: "24px",
    overflow: "auto",
  },
}

export default Layout
