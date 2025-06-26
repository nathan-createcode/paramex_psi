"use client"

import { useState } from "react"
import { Bell, User, UserRoundCog } from "lucide-react"

const Header = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isBellHovered, setIsBellHovered] = useState(false)
  const [isUserHovered, setIsUserHovered] = useState(false)
  const [isDropdownItemHovered, setIsDropdownItemHovered] = useState(false)

  const handleAccountSettings = () => {
    console.log("Account Settings button clicked!")
    setShowUserDropdown(false)
    // Trigger modal opening using custom event
    window.dispatchEvent(new CustomEvent("openAccountSettings"))
    console.log("Custom event dispatched")
  }

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setShowUserDropdown(false)
  }

  return (
    <>
      {/* Backdrop to close dropdown */}
      {showUserDropdown && <div style={styles.backdrop} onClick={handleClickOutside} />}

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.rightSection}>
            {/* Bell Icon */}
            <button
              style={{
                ...styles.iconButton,
                backgroundColor: isBellHovered ? "#E0E7FF" : "#EFF6FF",
              }}
              onMouseEnter={() => setIsBellHovered(true)}
              onMouseLeave={() => setIsBellHovered(false)}
            >
              <Bell size={20} />
              <span style={styles.notificationDot}></span>
            </button>

            {/* User Dropdown */}
            <div style={styles.userDropdown}>
              <button
                style={{
                  ...styles.userButton,
                  backgroundColor: showUserDropdown ? "#EFF6FF" : isUserHovered ? "#E0E7FF" : "#EFF6FF",
                }}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                onMouseEnter={() => setIsUserHovered(true)}
                onMouseLeave={() => setIsUserHovered(false)}
              >
                <User size={20} />
              </button>

              {showUserDropdown && (
                <div style={styles.dropdown}>
                  <button 
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: isDropdownItemHovered ? "#F3F4F6" : "transparent",
                    }}
                    onClick={handleAccountSettings}
                    onMouseEnter={() => setIsDropdownItemHovered(true)}
                    onMouseLeave={() => setIsDropdownItemHovered(false)}
                  >
                    <UserRoundCog size={16} />
                    <span style={{ fontWeight: "bold" }}>Account Settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  header: {
    height: "64px",
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: "white",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  headerContent: {
    height: "100%",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  iconButton: {
    position: "relative",
    padding: "12px",
    border: "none",
    backgroundColor: "#EFF6FF",
    borderRadius: "50%",
    cursor: "pointer",
    color: "#3B82F6",
    transition: "all 0.2s",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "8px",
    height: "8px",
    backgroundColor: "#EF4444",
    borderRadius: "50%",
    border: "2px solid white",
  },
  userDropdown: {
    position: "relative",
  },
  userButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    color: "#3B82F6",
    transition: "all 0.2s",
    width: "44px",
    height: "44px",
    backgroundColor: "#EFF6FF",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "8px",
    backgroundColor: "white",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    minWidth: "180px",
    zIndex: 60,
    overflow: "hidden",
  },
  dropdownItem: {
    width: "100%",
    padding: "12px 16px",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    color: "#374151",
    transition: "background-color 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    outline: "none",
  },
}

export default Header