"use client"

import { useState, useEffect } from "react"
import { User, Lock, Bell, Palette, Save, X } from "lucide-react"
import { supabase } from "../supabase/supabase" // Sesuaikan path

const AccountSettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    maxProjectsPerMonth: "", // Empty string for initial state
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: false,
    theme: "light",
  })

  // Load user data saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      loadUserData()
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

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Get current user dari Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Error getting user:", authError)
        showMessage("Error loading user data", "error")
        return
      }

      if (!user) {
        console.error("No user found")
        showMessage("No user session found", "error")
        return
      }

      setCurrentUser(user)

      // Get additional user data dari tabel users (jika ada)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, phone_number, max_projects_per_month")
        .eq("user_id", user.id)
        .single()

      // Populate form dengan data user
      const userMetadata = user.user_metadata || {}
      
      setFormData(prev => ({
        ...prev,
        fullName: userData?.name || userMetadata.full_name || userMetadata.display_name || "",
        email: user.email || "",
        phone: userData?.phone_number || userMetadata.phone || "",
        company: userMetadata.company || "",
        // If max_projects_per_month is null or undefined, set to empty string for the input field
        maxProjectsPerMonth: userData?.max_projects_per_month !== null && userData?.max_projects_per_month !== undefined ? userData.max_projects_per_month.toString() : "",
        // Reset password fields
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        // Load preferences dari user_metadata jika ada
        emailNotifications: userMetadata.email_notifications !== undefined ? userMetadata.email_notifications : true,
        pushNotifications: userMetadata.push_notifications !== undefined ? userMetadata.push_notifications : false,
        theme: userMetadata.theme || "light",
      }))

    } catch (error) {
      console.error("Error loading user data:", error)
      showMessage("Failed to load user data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const showMessage = (message, type = "success") => {
    const successMessage = document.createElement("div")
    successMessage.textContent = message
    successMessage.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#10B981" : "#EF4444"};
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

  const handleSaveProfile = async () => {
    if (!currentUser) {
      showMessage("No user session found", "error")
      return
    }

    // Validate max projects per month
    let maxProjectsToSave = null; // Default to null if empty or invalid
    if (formData.maxProjectsPerMonth !== "") {
      const parsedMaxProjects = parseInt(formData.maxProjectsPerMonth);
      if (isNaN(parsedMaxProjects) || parsedMaxProjects < 1 || parsedMaxProjects > 50) {
        showMessage("Max projects per month must be between 1 and 50", "error");
        return;
      }
      maxProjectsToSave = parsedMaxProjects;
    }

    try {
      setSaving(true)

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          display_name: formData.fullName,
          phone: formData.phone,
          company: formData.company,
        }
      })

      if (authError) throw authError

      // Check if user record exists first
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", currentUser.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingUser) {
        // User exists, update record
        const { error: updateError } = await supabase
          .from("users")
          .update({
            name: formData.fullName,
            phone_number: formData.phone,
            max_projects_per_month: maxProjectsToSave,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", currentUser.id)

        if (updateError) throw updateError
      } else {
        // User doesn't exist, insert new record
        // Generate a default password for the password column (if required)
        const defaultPassword = "temp_password_" + Math.random().toString(36).substring(2, 15);
        
        const { error: insertError } = await supabase
          .from("users")
          .insert([{
            user_id: currentUser.id,
            name: formData.fullName,
            email: formData.email,
            phone_number: formData.phone,
            password: defaultPassword, // Add password field to satisfy NOT NULL constraint
            max_projects_per_month: maxProjectsToSave,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (insertError) throw insertError
      }

      showMessage("Profile updated successfully!")
      
      // Reload user data to verify the save
      setTimeout(() => {
        loadUserData()
      }, 1000)
      
    } catch (error) {
      console.error("Error updating profile:", error)
      
      // Provide more specific error messages
      if (error.message?.includes("row-level security policy")) {
        showMessage("Permission denied. Please contact administrator to set up proper database permissions.", "error")
      } else if (error.message?.includes("duplicate key")) {
        showMessage("User record already exists. Please try refreshing the page.", "error")
      } else if (error.message?.includes("password")) {
        showMessage("Database schema issue with password field. Please contact administrator.", "error")
      } else {
        showMessage(`Failed to update profile: ${error.message}`, "error")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentUser) return

    if (formData.newPassword !== formData.confirmPassword) {
      showMessage("New passwords do not match", "error")
      return
    }

    if (formData.newPassword.length < 6) {
      showMessage("Password must be at least 6 characters", "error")
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))

      showMessage("Password updated successfully!")
      
    } catch (error) {
      console.error("Error updating password:", error)
      showMessage(error.message || "Failed to update password", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!currentUser) return

    try {
      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        data: {
          email_notifications: formData.emailNotifications,
          push_notifications: formData.pushNotifications,
        }
      })

      if (error) throw error

      showMessage("Notification preferences saved!")
      
    } catch (error) {
      console.error("Error saving notifications:", error)
      showMessage("Failed to save notification preferences", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTheme = async () => {
    if (!currentUser) return

    try {
      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        data: {
          theme: formData.theme,
        }
      })

      if (error) throw error

      showMessage("Theme preference saved!")
      
    } catch (error) {
      console.error("Error saving theme:", error)
      showMessage("Failed to save theme preference", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = (section) => {
    switch (section) {
      case "Profile":
        handleSaveProfile()
        break
      case "Password":
        handleSavePassword()
        break
      case "Notifications":
        handleSaveNotifications()
        break
      case "Theme":
        handleSaveTheme()
        break
      default:
        break
    }
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
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <div style={{ fontSize: "16px", color: "#6B7280" }}>Loading user data...</div>
        </div>
      )
    }

    return (
      <div style={{ maxWidth: "500px" }}>
        {activeTab === "profile" && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 8px 0" }}>
              Profile Information
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px 0" }}>
              Update your account details and personal information
            </p>
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
                  placeholder="Enter your full name"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  style={{ ...styles.input, backgroundColor: "#F9FAFB", cursor: "not-allowed" }}
                  readOnly
                  title="Email cannot be changed"
                />
                <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
                  Email address cannot be changed
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  style={styles.input}
                  placeholder="Enter your phone number"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  style={styles.input}
                  placeholder="Enter your company name"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  Maximum Projects Per Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxProjectsPerMonth}
                  onChange={(e) => handleInputChange("maxProjectsPerMonth", e.target.value)}
                  style={styles.input}
                  placeholder="Enter maximum projects per month"
                />
                <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
                  Set a monthly limit to help manage your workload (1-50 projects)
                </p>
              </div>
            </div>
            <button 
              style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }} 
              onClick={() => handleSave("Profile")}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </>
        )}

        {activeTab === "security" && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 8px 0" }}>Security</h2>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px 0" }}>
              Update your password to keep your account secure
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  style={styles.input}
                  placeholder="Enter new password (min. 6 characters)"
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
            <button 
              style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }} 
              onClick={() => handleSave("Password")}
              disabled={saving || !formData.newPassword || !formData.confirmPassword}
            >
              <Save size={16} />
              {saving ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

        {activeTab === "notifications" && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 8px 0" }}>
              Notifications
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px 0" }}>
              Choose how you want to be notified
            </p>
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
            <button 
              style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }} 
              onClick={() => handleSave("Notifications")}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </>
        )}

        {activeTab === "appearance" && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#1F2937", margin: "0 0 8px 0" }}>Appearance</h2>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px 0" }}>
              Customize the look and feel of your interface
            </p>
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
            <button 
              style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }} 
              onClick={() => handleSave("Theme")}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Theme"}
            </button>
          </>
        )}
      </div>
    )
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
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 4px 0" }}>
                Manage your account information and preferences
              </p>
              {currentUser && (
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                  Logged in as: {currentUser.email}
                </p>
              )}
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

