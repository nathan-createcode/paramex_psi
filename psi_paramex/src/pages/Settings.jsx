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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">App Settings</h1>
          <p className="text-lg text-gray-600 leading-relaxed">Manage your application preferences and configurations</p>
        </div>

        <div className="space-y-6">
          {/* Appearance & Theme */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <PaletteIcon />
                Appearance & Theme
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Theme</label>
                  <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm cursor-pointer outline-none min-w-[150px]"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Default View</label>
                  <p className="text-sm text-gray-600">Choose which page to show when you log in</p>
                </div>
                <select
                  value={settings.defaultView}
                  onChange={(e) => handleSettingChange("defaultView", e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm cursor-pointer outline-none min-w-[150px]"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="projects">Projects</option>
                  <option value="dss">DSS & AI</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BellIcon />
                Notifications
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Email Notifications</label>
                  <p className="text-sm text-gray-600">Receive project updates via email</p>
                </div>
                <div className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                    className="absolute opacity-0 cursor-pointer"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                      settings.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Push Notifications</label>
                  <p className="text-sm text-gray-600">Receive notifications in the browser</p>
                </div>
                <div className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange("pushNotifications", e.target.checked)}
                    className="absolute opacity-0 cursor-pointer"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                      settings.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.pushNotifications ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">AI Suggestions</label>
                  <p className="text-sm text-gray-600">Allow AI to provide project recommendations and insights</p>
                </div>
                <div className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.aiSuggestions}
                    onChange={(e) => handleSettingChange("aiSuggestions", e.target.checked)}
                    className="absolute opacity-0 cursor-pointer"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                      settings.aiSuggestions ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.aiSuggestions ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GlobeIcon />
                Regional Settings
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Language</label>
                  <p className="text-sm text-gray-600">Choose your preferred language</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange("language", e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm cursor-pointer outline-none min-w-[150px]"
                >
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Timezone</label>
                  <p className="text-sm text-gray-600">Set your local timezone</p>
                </div>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange("timezone", e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm cursor-pointer outline-none min-w-[150px]"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Currency</label>
                  <p className="text-sm text-gray-600">Default currency for payments</p>
                </div>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange("currency", e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm cursor-pointer outline-none min-w-[150px]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldIcon />
                Data & Privacy
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Export Data</label>
                  <p className="text-sm text-gray-600">Download your project data</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium">
                  <DownloadIcon />
                  Export
                </button>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Clear Cache</label>
                  <p className="text-sm text-gray-600">Clear application cache</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium">
                  <TrashIcon />
                  Clear
                </button>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">Delete Account</label>
                  <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium">
                  <TrashIcon />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
              } text-white`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

export default Settings
