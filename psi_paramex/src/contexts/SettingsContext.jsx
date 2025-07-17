import { createContext, useContext, useState, useEffect } from 'react'

// Translation data
const translations = {
  en: {
    // Navigation & Layout
    dashboard: "Dashboard",
    projects: "Projects",
    dss: "DSS & AI",
    help: "Help",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    
    // Dashboard
    welcomeBack: "Welcome back",
    totalProjects: "Total Projects", 
    activeProjects: "Active Projects",
    completedProjects: "Completed Projects",
    recentActivity: "Recent Activity",
    
    // Projects
    projectName: "Project Name",
    projectDescription: "Project Description",
    startDate: "Start Date",
    endDate: "End Date",
    status: "Status",
    priority: "Priority",
    budget: "Budget",
    team: "Team",
    
    // Status
    planning: "Planning",
    inProgress: "In Progress", 
    onHold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
    
    // Priority
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
    
    // Settings
    appSettings: "App Settings",
    settingsDesc: "Manage your application preferences and configurations",
    appearanceTheme: "Appearance & Theme",
    theme: "Theme",
    themeDesc: "Choose your preferred color scheme",
    defaultView: "Default View",
    defaultViewDesc: "Choose which page to show when you log in",
    notifications: "Notifications",
    emailNotifications: "Email Notifications",
    emailNotificationsDesc: "Receive project updates via email",
    pushNotifications: "Push Notifications", 
    pushNotificationsDesc: "Receive notifications in the browser",
    aiSuggestions: "AI Suggestions",
    aiSuggestionsDesc: "Allow AI to provide project recommendations and insights",
    testEmail: "Test Email",
    testEmailDesc: "Send a test email to verify your notification settings",
    sendTest: "Send Test",
    regionalSettings: "Regional Settings",
    language: "Language",
    languageDesc: "Choose your preferred language",
    timezone: "Timezone",
    timezoneDesc: "Set your local timezone",
    currency: "Currency",
    currencyDesc: "Default currency for payments",
    dataPrivacy: "Data & Privacy",
    exportData: "Export Data",
    exportDataDesc: "Download your project data",
    clearCache: "Clear Cache", 
    clearCacheDesc: "Clear application cache",
    deleteAccount: "Delete Account",
    deleteAccountDesc: "Permanently delete your account and all data",
    saveSettings: "Save Settings",
    saving: "Saving...",
    settingsSaved: "Settings saved successfully!",
    loadingSettings: "Loading settings...",
    
    // Messages & Alerts
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
    confirmDelete: "Are you sure you want to delete this item?",
    
    // Forms
    required: "This field is required",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 8 characters",
    
    // Time & Date
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year"
  },
  
  id: {
    // Navigation & Layout
    dashboard: "Dasbor",
    projects: "Proyek",
    dss: "DSS & AI",
    help: "Bantuan",
    settings: "Pengaturan",
    profile: "Profil",
    logout: "Keluar",
    
    // Common
    loading: "Memuat...",
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    edit: "Edit",
    add: "Tambah",
    search: "Cari",
    filter: "Filter",
    export: "Ekspor",
    import: "Impor",
    
    // Dashboard
    welcomeBack: "Selamat datang kembali",
    totalProjects: "Total Proyek",
    activeProjects: "Proyek Aktif", 
    completedProjects: "Proyek Selesai",
    recentActivity: "Aktivitas Terbaru",
    
    // Projects
    projectName: "Nama Proyek",
    projectDescription: "Deskripsi Proyek",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Selesai",
    status: "Status",
    priority: "Prioritas",
    budget: "Anggaran",
    team: "Tim",
    
    // Status
    planning: "Perencanaan",
    inProgress: "Sedang Berlangsung",
    onHold: "Tertunda",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    
    // Priority  
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
    critical: "Kritis",
    
    // Settings
    appSettings: "Pengaturan Aplikasi",
    settingsDesc: "Kelola preferensi dan konfigurasi aplikasi Anda",
    appearanceTheme: "Tampilan & Tema",
    theme: "Tema",
    themeDesc: "Pilih skema warna yang Anda sukai",
    defaultView: "Tampilan Default",
    defaultViewDesc: "Pilih halaman yang ditampilkan saat Anda masuk",
    notifications: "Notifikasi",
    emailNotifications: "Notifikasi Email",
    emailNotificationsDesc: "Terima pembaruan proyek melalui email",
    pushNotifications: "Notifikasi Push",
    pushNotificationsDesc: "Terima notifikasi di browser",
    aiSuggestions: "Saran AI", 
    aiSuggestionsDesc: "Izinkan AI memberikan rekomendasi dan wawasan proyek",
    testEmail: "Tes Email",
    testEmailDesc: "Kirim email tes untuk memverifikasi pengaturan notifikasi Anda",
    sendTest: "Kirim Tes",
    regionalSettings: "Pengaturan Regional",
    language: "Bahasa",
    languageDesc: "Pilih bahasa yang Anda sukai",
    timezone: "Zona Waktu",
    timezoneDesc: "Atur zona waktu lokal Anda",
    currency: "Mata Uang",
    currencyDesc: "Mata uang default untuk pembayaran",
    dataPrivacy: "Data & Privasi",
    exportData: "Ekspor Data",
    exportDataDesc: "Unduh data proyek Anda",
    clearCache: "Hapus Cache",
    clearCacheDesc: "Hapus cache aplikasi",
    deleteAccount: "Hapus Akun",
    deleteAccountDesc: "Hapus akun dan semua data secara permanen",
    saveSettings: "Simpan Pengaturan",
    saving: "Menyimpan...",
    settingsSaved: "Pengaturan berhasil disimpan!",
    loadingSettings: "Memuat pengaturan...",
    
    // Messages & Alerts
    success: "Berhasil",
    error: "Kesalahan",
    warning: "Peringatan", 
    info: "Informasi",
    confirmDelete: "Apakah Anda yakin ingin menghapus item ini?",
    
    // Forms
    required: "Bidang ini wajib diisi",
    invalidEmail: "Masukkan alamat email yang valid",
    passwordTooShort: "Password minimal 8 karakter",
    
    // Time & Date
    today: "Hari Ini",
    yesterday: "Kemarin",
    thisWeek: "Minggu Ini", 
    thisMonth: "Bulan Ini",
    thisYear: "Tahun Ini"
  }
}

// Default settings
const defaultSettings = {
  theme: "light",
  emailNotifications: true,
  pushNotifications: false,
  aiSuggestions: true,
  defaultView: "dashboard",
  language: "en",
  timezone: "UTC",
  currency: "USD",
}

// Create Settings Context
const SettingsContext = createContext()

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update settings and save to localStorage
  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    try {
      localStorage.setItem('userSettings', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Get translation for current language
  const t = (key, fallback = key) => {
    const translation = translations[settings.language]?.[key]
    return translation || fallback
  }

  // Format currency based on current currency setting
  const formatCurrency = (amount, compact = false) => {
    // Handle edge cases
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0
    }
    
    // Ensure amount is a number
    const numericAmount = Number(amount) || 0
    
    const currencyMap = {
      USD: 'en-US',
      IDR: 'id-ID', 
      EUR: 'de-DE',
      GBP: 'en-GB'
    }
    
    try {
      // Compact notation for large numbers
      if (compact && numericAmount >= 1000) {
        // Try native compact format first
        const nativeFormat = new Intl.NumberFormat(currencyMap[settings.currency] || 'en-US', {
          style: 'currency',
          currency: settings.currency,
          notation: 'compact',
          compactDisplay: 'short',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }).format(numericAmount)
        
        // If Indonesian language, replace English suffixes with Indonesian ones
        if (settings.language === 'id') {
          return nativeFormat
            .replace(/K$/, 'Rb')    // Ribu
            .replace(/M$/, 'Jt')    // Juta  
            .replace(/B$/, 'M')     // Miliar (in Indonesian, billion = miliar)
            .replace(/T$/, 'T')     // Triliun
        }
        
        return nativeFormat
      }
      
      // Regular currency format
      return new Intl.NumberFormat(currencyMap[settings.currency] || 'en-US', {
        style: 'currency',
        currency: settings.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(numericAmount)
    } catch (error) {
      console.error('Currency formatting error:', error)
      
      // Fallback compact format
      if (compact && numericAmount >= 1000) {
        const formatCompactFallback = (num) => {
          const currencySymbol = {
            USD: '$',
            IDR: 'Rp',
            EUR: '€',
            GBP: '£'
          }[settings.currency] || settings.currency
          
          if (settings.language === 'id') {
            // Indonesian suffixes
            if (num >= 1e12) return `${currencySymbol}${(num / 1e12).toFixed(1)}T`
            if (num >= 1e9) return `${currencySymbol}${(num / 1e9).toFixed(1)}M`
            if (num >= 1e6) return `${currencySymbol}${(num / 1e6).toFixed(1)}Jt`
            if (num >= 1e3) return `${currencySymbol}${(num / 1e3).toFixed(1)}Rb`
          } else {
            // English suffixes
            if (num >= 1e12) return `${currencySymbol}${(num / 1e12).toFixed(1)}T`
            if (num >= 1e9) return `${currencySymbol}${(num / 1e9).toFixed(1)}B`
            if (num >= 1e6) return `${currencySymbol}${(num / 1e6).toFixed(1)}M`
            if (num >= 1e3) return `${currencySymbol}${(num / 1e3).toFixed(1)}K`
          }
          return `${currencySymbol}${num.toLocaleString()}`
        }
        return formatCompactFallback(numericAmount)
      }
      
      return `${settings.currency} ${numericAmount.toLocaleString()}`
    }
  }

  // Format date based on language and timezone
  const formatDate = (date, options = {}) => {
    try {
      const defaultOptions = {
        timeZone: settings.timezone,
        ...options
      }
      return new Intl.DateTimeFormat(
        settings.language === 'id' ? 'id-ID' : 'en-US', 
        defaultOptions
      ).format(new Date(date))
    } catch (error) {
      return new Date(date).toLocaleDateString()
    }
  }

  // Format time based on timezone
  const formatTime = (date) => {
    try {
      const options = {
        timeZone: settings.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
      return new Intl.DateTimeFormat(
        settings.language === 'id' ? 'id-ID' : 'en-US', 
        options
      ).format(new Date(date))
    } catch (error) {
      return new Date(date).toLocaleTimeString()
    }
  }

  const value = {
    settings,
    updateSettings,
    loading,
    t,
    formatCurrency,
    formatDate,
    formatTime,
    translations: translations[settings.language] || translations.en
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export default SettingsContext 