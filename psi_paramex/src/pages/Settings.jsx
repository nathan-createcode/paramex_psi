"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    theme: "light",
    emailNotifications: true,
    pushNotifications: false,
    aiSuggestions: true,
    defaultView: "dashboard",
    language: "en",
    timezone: "UTC",
    currency: "USD",
  })
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

        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        navigate("/login")
      }
    }

    checkAuth()
  }, [navigate])

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveSettings = async () => {
    setSaving(true)

    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Here you would typically save to Supabase or your backend
    console.log("Settings saved:", settings)

    setSaving(false)

    // Show success message (you could add a toast notification here)
    alert("Settings saved successfully!")
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Loading settings...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>App Settings</h1>
            <p style={styles.subtitle}>Manage your application preferences and configurations</p>
          </div>
        </div>

        <div style={styles.content}>
          {/* Appearance & Theme */}
          <div style={styles.settingsCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <PaletteIcon />
                Appearance & Theme
              </h2>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.settingGroup}>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Theme</label>
                    <p style={styles.settingDescription}>Choose your preferred color scheme</p>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange("theme", e.target.value)}
                    style={styles.select}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Default View</label>
                    <p style={styles.settingDescription}>Choose which page to show when you log in</p>
                  </div>
                  <select
                    value={settings.defaultView}
                    onChange={(e) => handleSettingChange("defaultView", e.target.value)}
                    style={styles.select}
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="projects">Projects</option>
                    <option value="dss">DSS & AI</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div style={styles.settingsCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <BellIcon />
                Notifications
              </h2>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.settingGroup}>
                <div style={styles.toggleItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Email Notifications</label>
                    <p style={styles.settingDescription}>Receive project updates via email</p>
                  </div>
                  <div style={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                      style={styles.toggleInput}
                    />
                    <div
                      style={{
                        ...styles.toggleSlider,
                        backgroundColor: settings.emailNotifications ? "#3B82F6" : "#D1D5DB",
                      }}
                    >
                      <div
                        style={{
                          ...styles.toggleThumb,
                          transform: settings.emailNotifications ? "translateX(20px)" : "translateX(0)",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div style={styles.toggleItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Push Notifications</label>
                    <p style={styles.settingDescription}>Receive notifications in the browser</p>
                  </div>
                  <div style={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange("pushNotifications", e.target.checked)}
                      style={styles.toggleInput}
                    />
                    <div
                      style={{
                        ...styles.toggleSlider,
                        backgroundColor: settings.pushNotifications ? "#3B82F6" : "#D1D5DB",
                      }}
                    >
                      <div
                        style={{
                          ...styles.toggleThumb,
                          transform: settings.pushNotifications ? "translateX(20px)" : "translateX(0)",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div style={styles.toggleItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>AI Suggestions</label>
                    <p style={styles.settingDescription}>Allow AI to provide project recommendations and insights</p>
                  </div>
                  <div style={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      checked={settings.aiSuggestions}
                      onChange={(e) => handleSettingChange("aiSuggestions", e.target.checked)}
                      style={styles.toggleInput}
                    />
                    <div
                      style={{
                        ...styles.toggleSlider,
                        backgroundColor: settings.aiSuggestions ? "#3B82F6" : "#D1D5DB",
                      }}
                    >
                      <div
                        style={{
                          ...styles.toggleThumb,
                          transform: settings.aiSuggestions ? "translateX(20px)" : "translateX(0)",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div style={styles.settingsCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <GlobeIcon />
                Regional Settings
              </h2>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.settingGroup}>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Language</label>
                    <p style={styles.settingDescription}>Choose your preferred language</p>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    style={styles.select}
                  >
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Timezone</label>
                    <p style={styles.settingDescription}>Set your local timezone</p>
                  </div>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange("timezone", e.target.value)}
                    style={styles.select}
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Currency</label>
                    <p style={styles.settingDescription}>Default currency for payments</p>
                  </div>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange("currency", e.target.value)}
                    style={styles.select}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div style={styles.settingsCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <ShieldIcon />
                Data & Privacy
              </h2>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.actionGroup}>
                <div style={styles.actionItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Export Data</label>
                    <p style={styles.settingDescription}>Download your project data</p>
                  </div>
                  <button style={styles.actionButton}>
                    <DownloadIcon />
                    Export
                  </button>
                </div>

                <div style={styles.actionItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Clear Cache</label>
                    <p style={styles.settingDescription}>Clear application cache</p>
                  </div>
                  <button style={styles.actionButton}>
                    <TrashIcon />
                    Clear
                  </button>
                </div>

                <div style={styles.actionItem}>
                  <div style={styles.settingInfo}>
                    <label style={styles.settingLabel}>Delete Account</label>
                    <p style={styles.settingDescription}>Permanently delete your account and all data</p>
                  </div>
                  <button style={{ ...styles.actionButton, ...styles.dangerButton }}>
                    <TrashIcon />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={styles.saveContainer}>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.saveButtonDisabled : {}),
              }}
            >
              {saving ? (
                <>
                  <div style={styles.buttonSpinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Icon Components
const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
)

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const SaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
)

const styles = {
  container: {
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
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: 0,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  settingsCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "24px 32px 0 32px",
    borderBottom: "1px solid #F3F4F6",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardContent: {
    padding: "0 32px 32px 32px",
  },
  settingGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  settingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  toggleItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 0",
    borderBottom: "1px solid #F3F4F6",
  },
  actionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 0",
    borderBottom: "1px solid #F3F4F6",
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1F2937",
    display: "block",
    marginBottom: "4px",
  },
  settingDescription: {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: "150px",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  toggleContainer: {
    position: "relative",
    cursor: "pointer",
  },
  toggleInput: {
    position: "absolute",
    opacity: 0,
    cursor: "pointer",
  },
  toggleSlider: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    transition: "background-color 0.3s",
    position: "relative",
  },
  toggleThumb: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "white",
    position: "absolute",
    top: "2px",
    left: "2px",
    transition: "transform 0.3s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  },
  actionGroup: {
    display: "flex",
    flexDirection: "column",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#F3F4F6",
    color: "#374151",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  dangerButton: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    borderColor: "#FECACA",
  },
  saveContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "24px 0",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "16px 32px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    transition: "all 0.2s",
  },
  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
    cursor: "not-allowed",
  },
  buttonSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid transparent",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
}

export default Settings
