// API Configuration for different environments
const API_CONFIG = {
  development: {
    baseURL: "http://localhost:8000"
  },
  production: {
    baseURL: "https://a1751af609f9.ngrok-free.app"  // Current ngrok URL
  }
}

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production

export const API_BASE_URL = currentConfig.baseURL

// API Endpoints
export const API_ENDPOINTS = {
  chat: `${API_BASE_URL}/api/chat`,
  userProjects: (userId) => `${API_BASE_URL}/api/user-projects/${userId}`,
  health: `${API_BASE_URL}/health`,
  projectAnalysis: `${API_BASE_URL}/api/project-analysis`,
  dashboardSummary: `${API_BASE_URL}/api/dashboard-summary`,
  emailTest: `${API_BASE_URL}/api/email/test`,
}

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData.error) {
        errorMessage = errorData.error.message || errorData.error
      }
    } catch {
      // If we can't parse the error response, use the status code
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// Environment info
export const ENV_INFO = {
  isDevelopment,
  currentConfig,
  mode: isDevelopment ? 'development' : 'production',
  baseURL: API_BASE_URL
} 