"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import AccountSettingsModal from "../pages/AccountSettingsModal"

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Sync with sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen')
    return savedState !== null ? JSON.parse(savedState) : true
  })
  
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)

  // Listen for sidebar state changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('sidebarOpen')
      if (savedState !== null) {
        setSidebarOpen(JSON.parse(savedState))
      }
    }

    // Listen for storage events (when localStorage changes)
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event from sidebar
    const handleSidebarToggle = () => {
      const savedState = localStorage.getItem('sidebarOpen')
      if (savedState !== null) {
        setSidebarOpen(JSON.parse(savedState))
      }
    }
    
    window.addEventListener('sidebarToggle', handleSidebarToggle)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarToggle', handleSidebarToggle)
    }
  }, [])

  // Don't show layout for login/register/landing pages
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/"

  // Listen for account settings modal events from Header
  useEffect(() => {
    const handleOpenAccountSettings = () => {
      console.log("openAccountSettings event received!")
      setAccountSettingsOpen(true)
    }

    // Add event listener for custom events from Header
    window.addEventListener("openAccountSettings", handleOpenAccountSettings)
    console.log("Event listener added for openAccountSettings")

    return () => {
      window.removeEventListener("openAccountSettings", handleOpenAccountSettings)
      console.log("Event listener removed for openAccountSettings")
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

  // Handle responsive sidebar - only for screen resize, not initial state
  useEffect(() => {
    const handleResize = () => {
      // Only force close on mobile, but don't force open on desktop
      // Let localStorage state persist unless we're on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
        localStorage.setItem('sidebarOpen', JSON.stringify(false))
        window.dispatchEvent(new Event('sidebarToggle'))
      }
      // Don't automatically open on desktop - respect localStorage state
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div
        style={{
          ...styles.mainContent,
          marginLeft: sidebarOpen ? "300px" : "80px",
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