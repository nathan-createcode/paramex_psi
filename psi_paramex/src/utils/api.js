// API Configuration for development and production
const API_CONFIG = {
  development: {
    baseURL: "http://localhost:8000/api"
  },
  production: {
    baseURL: "/api"  // Vercel serverless functions
  }
}

// Get current environment
const isDevelopment = import.meta.env.MODE === 'development'
const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production

export const API_BASE_URL = currentConfig.baseURL

// API Endpoints
export const API_ENDPOINTS = {
  chat: `${API_BASE_URL}/chat`,
  health: `${API_BASE_URL}/health`,
  projectAnalysis: `${API_BASE_URL}/project-analysis`,
  dashboardSummary: `${API_BASE_URL}/dashboard-summary`,
  userProjects: (userId) => `${API_BASE_URL}/user-projects/${userId}`,
  emailTest: `${API_BASE_URL}/email/test`,
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
  mode: import.meta.env.MODE,
} 