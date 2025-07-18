"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import { useSettings } from "../contexts/SettingsContext"
import Layout from "../components/Layout"
import { ChevronDown } from "lucide-react"
import Dropdown from "../components/ui/dropdown"

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const { settings, updateSettings, t, formatCurrency, formatDate, formatTime } = useSettings()
  const navigate = useNavigate()

  // Authentication check and load settings
  useEffect(() => {
    const checkAuthAndLoadSettings = async () => {
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
        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        navigate("/login")
      }
    }

    checkAuthAndLoadSettings()
  }, [navigate])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  const handleSettingChange = async (key, value) => {
    // Handle special cases
    if (key === 'pushNotifications' && value) {
      const permission = await requestNotificationPermission()
      if (!permission) {
        alert('Please enable notifications in your browser settings')
        return
      }
    }

    // Update settings using context
    updateSettings({ [key]: value })

    // Show notification for certain toggles
    if (key === 'emailNotifications') {
      if (value) {
        showNotification('Email notifications enabled', 'You will receive project updates via email')
        // Test email sending when enabled
        await handleTestEmail()
      } else {
        showNotification('Email notifications disabled', 'You will no longer receive email updates')
      }
    }

    if (key === 'aiSuggestions') {
      if (value) {
        showNotification('AI Suggestions enabled', 'AI will now provide project recommendations')
      } else {
        showNotification('AI Suggestions disabled', 'AI recommendations are turned off')
      }
    }
  }

  const handleTestEmail = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email,
          user_name: user?.user_metadata?.full_name || user?.email || 'User'
        })
      })

      const result = await response.json()

      if (response.ok) {
        showNotification('Test email sent!', 'Check your inbox for the test email confirmation')
        alert('✅ Test email sent successfully! Check your inbox.')
      } else {
        console.error('Email test failed:', result)
        alert(`❌ Email test failed: ${result.detail || 'Please check Supabase configuration'}`)
      }
    } catch (error) {
      console.error('Email test error:', error)
      alert('❌ Email test failed: Backend not available or Supabase not configured')
    }
  }

  const showNotification = (title, body) => {
    if (settings.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  const handleExportData = async () => {
    try {
      // Get user data from Supabase
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // Create export data
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          created_at: user?.created_at
        },
        profile: userData,
        settings: settings,
        exportedAt: new Date().toISOString()
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `paramex-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showNotification('Data exported', 'Your data has been downloaded successfully')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear the application cache? This will remove all locally stored data.')) {
      // Clear localStorage except essential auth data
      const keysToKeep = ['sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token']
      const allKeys = Object.keys(localStorage)
      
      allKeys.forEach(key => {
        if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
          localStorage.removeItem(key)
        }
      })

      // Clear sessionStorage
      sessionStorage.clear()

      showNotification('Cache cleared', 'Application cache has been cleared successfully')
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('This action cannot be undone. Type "DELETE" to confirm account deletion:')
    
    if (confirmation === 'DELETE') {
      try {
        // Delete user data from Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user?.id)

        if (profileError) console.warn('Profile deletion error:', profileError)

        // Sign out user
        await supabase.auth.signOut()
        
        // Clear all local data
        localStorage.clear()
        sessionStorage.clear()
        
        alert('Account deleted successfully. You will be redirected to the landing page.')
        navigate('/')
      } catch (error) {
        console.error('Account deletion error:', error)
        alert('Failed to delete account. Please contact support.')
      }
    } else if (confirmation !== null) {
      alert('Account deletion cancelled. Please type "DELETE" exactly to confirm.')
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)

    try {
      // Settings are already saved automatically via context
      // Simulate API save
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Settings saved:", settings)
      showNotification(t('settingsSaved'), 'Your preferences have been updated')
      alert(t('settingsSaved'))
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
    setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">{t('loadingSettings')}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('appSettings')}</h1>
          <p className="text-lg text-gray-600 leading-relaxed">{t('settingsDesc')}</p>
        </div>

        <div className="space-y-6">
          {/* Appearance & Theme */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <PaletteIcon />
                {t('appearanceTheme')}
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('theme')}</label>
                  <p className="text-sm text-gray-600">{t('themeDesc')}</p>
                </div>
                <Dropdown
                  value={settings.theme}
                  onChange={(value) => handleSettingChange("theme", value)}
                  options={[
                    { value: "light", label: "Light" }
                  ]}
                  placeholder="Select theme"
                  className="min-w-[150px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('defaultView')}</label>
                  <p className="text-sm text-gray-600">{t('defaultViewDesc')}</p>
                </div>
                <Dropdown
                  value={settings.defaultView}
                  onChange={(value) => handleSettingChange("defaultView", value)}
                  options={[
                    { value: "dashboard", label: t('dashboard') },
                    { value: "projects", label: t('projects') },
                    { value: "dss", label: t('dss') }
                  ]}
                  placeholder="Select view"
                  className="min-w-[150px]"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BellIcon />
                {t('notifications')}
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('emailNotifications')}</label>
                  <p className="text-sm text-gray-600">{t('emailNotificationsDesc')}</p>
                </div>
                <div 
                  className="relative cursor-pointer"
                  onClick={() => handleSettingChange("emailNotifications", !settings.emailNotifications)}
                >
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => {}} // Handled by onClick above
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
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('pushNotifications')}</label>
                  <p className="text-sm text-gray-600">{t('pushNotificationsDesc')}</p>
                </div>
                <div 
                  className="relative cursor-pointer"
                  onClick={() => handleSettingChange("pushNotifications", !settings.pushNotifications)}
                >
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => {}} // Handled by onClick above
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
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('aiSuggestions')}</label>
                  <p className="text-sm text-gray-600">{t('aiSuggestionsDesc')}</p>
                </div>
                <div 
                  className="relative cursor-pointer"
                  onClick={() => handleSettingChange("aiSuggestions", !settings.aiSuggestions)}
                >
                  <input
                    type="checkbox"
                    checked={settings.aiSuggestions}
                    onChange={() => {}} // Handled by onClick above
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

              {/* Test Email Button */}
              <div className="flex justify-between items-center py-2 border-t border-gray-100 mt-4 pt-4">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('testEmail')}</label>
                  <p className="text-sm text-gray-600">{t('testEmailDesc')}</p>
                </div>
                <button 
                  onClick={handleTestEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <EmailIcon />
                  {t('sendTest')}
                </button>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GlobeIcon />
                {t('regionalSettings')}
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('language')}</label>
                  <p className="text-sm text-gray-600">{t('languageDesc')}</p>
                </div>
                <Dropdown
                  value={settings.language}
                  onChange={(value) => handleSettingChange("language", value)}
                  options={[
                    { value: "en", label: "English" }
                  ]}
                  placeholder="Select language"
                  className="min-w-[150px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('timezone')}</label>
                  <p className="text-sm text-gray-600">{t('timezoneDesc')}</p>
                </div>
                <Dropdown
                  value={settings.timezone}
                  onChange={(value) => handleSettingChange("timezone", value)}
                  options={[
                    { value: "UTC", label: "UTC" }
                  ]}
                  placeholder="Select timezone"
                  className="min-w-[150px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('currency')}</label>
                  <p className="text-sm text-gray-600">{t('currencyDesc')}</p>
                </div>
                <Dropdown
                  value={settings.currency}
                  onChange={(value) => handleSettingChange("currency", value)}
                  options={[
                    { value: "USD", label: "USD ($)" }
                  ]}
                  placeholder="Select currency"
                  className="min-w-[150px]"
                />
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldIcon />
                {t('dataPrivacy')}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('exportData')}</label>
                  <p className="text-sm text-gray-600">{t('exportDataDesc')}</p>
                </div>
                <button 
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <DownloadIcon />
                  {t('export')}
                </button>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('clearCache')}</label>
                  <p className="text-sm text-gray-600">{t('clearCacheDesc')}</p>
                </div>
                <button 
                  onClick={handleClearCache}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <TrashIcon />
                  Clear
                </button>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900 block mb-1">{t('deleteAccount')}</label>
                  <p className="text-sm text-gray-600">{t('deleteAccountDesc')}</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <TrashIcon />
                  {t('delete')}
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
                  {t('saving')}
                </>
              ) : (
                <>
                  <SaveIcon />
                  {t('saveSettings')}
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

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

export default Settings
