"use client"

import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./supabase/supabase"
import LandingPage from "./pages/landing-page"
import LoginPage from "./pages/login-page"
import RegisterPage from "./pages/register-page"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import DSS from "./pages/DSS"
import ProjectAdvisor from "./pages/ProjectAdvisor"
import Settings from "./pages/Settings"
import Help from "./pages/Help"
import { ProjectForm } from "./pages/project-form"

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cek session saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Set up listener untuk perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Menggunakan React Router untuk navigasi
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <RegisterPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={!session ? <Navigate to="/login" /> : <Dashboard />} />
        <Route path="/projects" element={!session ? <Navigate to="/login" /> : <Projects />} />
        <Route path="/dss" element={!session ? <Navigate to="/login" /> : <DSS />} />
        <Route path="/project-advisor" element={!session ? <Navigate to="/login" /> : <ProjectAdvisor />} />
        <Route path="/settings" element={!session ? <Navigate to="/login" /> : <Settings />} />
        <Route path="/help" element={!session ? <Navigate to="/login" /> : <Help />} />
        <Route path="project-form" element={!session ? <Navigate to="project-form"/> : <ProjectForm/>}/>

        {/* Account Settings Modal Route - renders dashboard with modal overlay */}
        <Route path="/account-settings" element={!session ? <Navigate to="/login" /> : <Dashboard />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
