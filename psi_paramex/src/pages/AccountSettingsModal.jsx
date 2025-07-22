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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

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

      setFormData((prev) => ({
        ...prev,
        fullName: userData?.name || userMetadata.full_name || userMetadata.display_name || "",
        email: user.email || "",
        phone: userData?.phone_number || userMetadata.phone || "",
        company: userMetadata.company || "",
        // If max_projects_per_month is null or undefined, set to empty string for the input field
        maxProjectsPerMonth:
          userData?.max_projects_per_month !== null && userData?.max_projects_per_month !== undefined
            ? userData.max_projects_per_month.toString()
            : "",
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
    let maxProjectsToSave = null // Default to null if empty or invalid
    if (formData.maxProjectsPerMonth !== "") {
      const parsedMaxProjects = Number.parseInt(formData.maxProjectsPerMonth)
      if (Number.isNaN(parsedMaxProjects) || parsedMaxProjects < 1 || parsedMaxProjects > 50) {
        showMessage("Max projects per month must be between 1 and 50", "error")
        return
      }
      maxProjectsToSave = parsedMaxProjects
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
        },
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
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", currentUser.id)
        if (updateError) throw updateError
      } else {
        // User doesn't exist, insert new record
        // Generate a default password for the password column (if required)
        const defaultPassword = `temp_password_${Math.random().toString(36).substring(2, 15)}`

        const { error: insertError } = await supabase.from("users").insert([
          {
            user_id: currentUser.id,
            name: formData.fullName,
            email: formData.email,
            phone_number: formData.phone,
            password: defaultPassword, // Add password field to satisfy NOT NULL constraint
            max_projects_per_month: maxProjectsToSave,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

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
        password: formData.newPassword,
      })
      if (error) throw error

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
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
        },
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
        },
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
        <div className="loading-container">
          <div className="loading-text">Loading user data...</div>
        </div>
      )
    }

    return (
      <div className="content-wrapper">
        {activeTab === "profile" && (
          <>
            <h2 className="section-title">Profile Information</h2>
            <p className="section-description">Update your account details and personal information</p>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  className="form-input form-input-readonly"
                  readOnly
                  title="Email cannot be changed"
                />
                <p className="form-hint">Email address cannot be changed</p>
              </div>
              <div className="form-field">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="form-input"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="form-input"
                  placeholder="Enter your company name"
                />
              </div>
            </div>
            <button
              className={`save-button ${saving ? "saving" : ""}`}
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
            <h2 className="section-title">Security</h2>
            <p className="section-description">Update your password to keep your account secure</p>
            <div className="form-grid-single">
              <div className="form-field">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  className="form-input"
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="form-input"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <button
              className={`save-button ${saving ? "saving" : ""}`}
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
            <h2 className="section-title">Notifications</h2>
            <p className="section-description">Choose how you want to be notified</p>
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h4 className="notification-title">Email Notifications</h4>
                  <p className="notification-description">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                  className="notification-checkbox"
                />
              </div>
              <div className="notification-item">
                <div className="notification-info">
                  <h4 className="notification-title">Push Notifications</h4>
                  <p className="notification-description">Receive push notifications in browser</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.pushNotifications}
                  onChange={(e) => handleInputChange("pushNotifications", e.target.checked)}
                  className="notification-checkbox"
                />
              </div>
            </div>
            <button
              className={`save-button ${saving ? "saving" : ""}`}
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
            <h2 className="section-title">Appearance</h2>
            <p className="section-description">Customize the look and feel of your interface</p>
            <div className="form-field">
              <label className="form-label">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => handleInputChange("theme", e.target.value)}
                className="form-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <button
              className={`save-button ${saving ? "saving" : ""}`}
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
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-content">
          {/* Mobile Tab Navigation */}
          <div className="mobile-tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`mobile-tab ${activeTab === tab.id ? "active" : ""}`}
                >
                  <IconComponent size={18} />
                  <span className="mobile-tab-label">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Account Settings</h3>
              <p className="sidebar-description">Manage your account information and preferences</p>
              {currentUser && <p className="sidebar-user">Logged in as: {currentUser.email}</p>}
            </div>
            <nav className="sidebar-nav">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="content">{renderContent()}</div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.25rem;
        }

        .modal-container {
          background-color: white;
          border-radius: 0.75rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          max-width: 56.25rem;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.5rem;
          border: none;
          background-color: transparent;
          cursor: pointer;
          border-radius: 0.375rem;
          color: #6b7280;
          z-index: 10;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: #f3f4f6;
        }

        .modal-content {
          display: flex;
          height: 37.5rem;
        }

        .mobile-tabs {
          display: none;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.5rem;
          overflow-x: auto;
        }

        .mobile-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
          text-align: center;
          background-color: transparent;
          color: #6b7280;
          min-width: 4rem;
          flex-shrink: 0;
        }

        .mobile-tab.active {
          background-color: #3b82f6;
          color: white;
        }

        .mobile-tab-label {
          font-size: 0.6875rem;
        }

        .sidebar {
          width: 17.5rem;
          background-color: #f8f9fa;
          border-right: 1px solid #e5e7eb;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          margin-bottom: 2rem;
        }

        .sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .sidebar-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .sidebar-user {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          text-align: left;
          background-color: transparent;
          color: #6b7280;
        }

        .tab-button.active {
          background-color: #3b82f6;
          color: white;
        }

        .tab-button:hover:not(.active) {
          background-color: #e5e7eb;
        }

        .content {
          flex: 1;
          padding: 2rem;
          overflow: auto;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 18.75rem;
        }

        .loading-text {
          font-size: 1rem;
          color: #6b7280;
        }

        .content-wrapper {
          max-width: 31.25rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 1.5rem 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-grid-single {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input-readonly {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .form-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background-color: white;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .notification-info {
          flex: 1;
        }

        .notification-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .notification-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .notification-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        .save-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-button:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .save-button.saving {
          opacity: 0.7;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .modal-backdrop {
            padding: 0.5rem;
          }

          .modal-container {
            max-height: 95vh;
            border-radius: 0.5rem;
          }

          .close-button {
            top: 0.75rem;
            right: 0.75rem;
          }

          .modal-content {
            flex-direction: column;
            height: auto;
            max-height: 90vh;
          }

          .mobile-tabs {
            display: flex;
            gap: 0.5rem;
          }

          .sidebar {
            display: none;
          }

          .content {
            padding: 1.5rem 1rem;
            overflow-y: auto;
          }

          .content-wrapper {
            max-width: 100%;
          }

          .section-title {
            font-size: 1.125rem;
          }

          .section-description {
            font-size: 0.8125rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .form-input,
          .form-select {
            padding: 0.875rem 0.75rem;
          }

          .notification-item {
            padding: 0.875rem;
          }

          .save-button {
            width: 100%;
            justify-content: center;
            padding: 0.875rem 1.5rem;
          }
        }

        /* Small Mobile Styles */
        @media (max-width: 480px) {
          .modal-backdrop {
            padding: 0.25rem;
          }

          .close-button {
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.375rem;
          }

          .content {
            padding: 1rem 0.75rem;
          }

          .section-title {
            font-size: 1rem;
          }

          .section-description {
            font-size: 0.75rem;
          }

          .mobile-tab {
            padding: 0.375rem 0.5rem;
            min-width: 3.5rem;
          }

          .mobile-tab-label {
            font-size: 0.625rem;
          }

          .form-input,
          .form-select {
            padding: 0.75rem 0.625rem;
            font-size: 0.8125rem;
          }

          .notification-item {
            padding: 0.75rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .notification-checkbox {
            align-self: flex-end;
          }
        }

        /* Large Desktop Styles */
        @media (min-width: 1024px) {
          .modal-container {
            max-width: 62.5rem;
          }

          .sidebar {
            width: 20rem;
            padding: 2rem;
          }

          .content {
            padding: 2.5rem;
          }

          .content-wrapper {
            max-width: 37.5rem;
          }

          .form-grid {
            grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
          }
        }
      `}</style>
    </div>
  )
}

export default AccountSettingsModal
