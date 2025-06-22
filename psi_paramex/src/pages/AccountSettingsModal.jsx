"use client"

import { useState, useEffect } from "react"
import { User, Lock, Bell, Palette, Save, X } from "lucide-react"

const AccountSettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile")
  const [formData, setFormData] = useState({
    fullName: "Nathan Achmadi",
    email: "nathan@example.com",
    phone: "+62 812-3456-7890",
    company: "Freelance Developer",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: false,
    theme: "light",
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      const handleEsc = (e) => {
        if (e.key === "Escape") onClose()
      }
      document.addEventListener("keydown", handleEsc)
      return () => {
        document.removeEventListener("keydown", handleEsc)
        document.body.style.overflow = "unset"
      }
    }
  }, [isOpen, onClose])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = (section) => {
    // You can replace this with actual API calls
    console.log(`Saving ${section} settings:`, formData)

    // Show success message
    const successMessage = document.createElement("div")
    successMessage.textContent = `${section} settings saved successfully!`
    successMessage.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    `
    document.body.appendChild(successMessage)

    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage)
      }
    }, 3000)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: "profile", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 24px 0" }}>
              Profile Information
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
            <button style={styles.saveButton} onClick={() => handleSave("Profile")}>
              <Save size={16} />
              Save Profile
            </button>
          </div>
        )

      case "security":
        return (
          <div style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 24px 0" }}>Security</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                  style={styles.input}
                  placeholder="Enter current password"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  style={styles.input}
                  placeholder="Enter new password"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  style={styles.input}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <button style={styles.saveButton} onClick={() => handleSave("Password")}>
              <Save size={16} />
              Update Password
            </button>
          </div>
        )

      case "notifications":
        return (
          <div style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 24px 0" }}>
              Notifications
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div style={styles.notificationItem}>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937", margin: "0 0 4px 0" }}>
                    Email Notifications
                  </h4>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.notificationItem}>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937", margin: "0 0 4px 0" }}>
                    Push Notifications
                  </h4>
                  <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Receive push notifications in browser</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.pushNotifications}
                  onChange={(e) => handleInputChange("pushNotifications", e.target.checked)}
                  style={styles.checkbox}
                />
              </div>
            </div>
            <button style={styles.saveButton} onClick={() => handleSave("Notifications")}>
              <Save size={16} />
              Save Preferences
            </button>
          </div>
        )

      case "appearance":
        return (
          <div style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 24px 0" }}>Appearance</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => handleInputChange("theme", e.target.value)}
                style={styles.select}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <button style={styles.saveButton} onClick={() => handleSave("Theme")}>
              <Save size={16} />
              Save Theme
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <div style={styles.modalContent}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1F2937", margin: "0 0 8px 0" }}>
                Account Settings
              </h3>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
                Manage your account information and preferences
              </p>
            </div>
            <nav style={styles.nav}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      ...styles.tabButton,
                      backgroundColor: activeTab === tab.id ? "#3B82F6" : "transparent",
                      color: activeTab === tab.id ? "white" : "#6B7280",
                    }}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div style={styles.content}>{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "80vh",
    overflow: "hidden",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    padding: "8px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    borderRadius: "6px",
    color: "#6B7280",
    zIndex: 10,
    transition: "background-color 0.2s",
  },
  modalContent: {
    display: "flex",
    height: "600px",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#F8F9FA",
    borderRight: "1px solid #E5E7EB",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    marginBottom: "32px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    textAlign: "left",
  },
  content: {
    flex: 1,
    padding: "32px",
    overflow: "auto",
  },
  input: {
    padding: "12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    padding: "12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  notificationItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
  },
}

export default AccountSettingsModal
