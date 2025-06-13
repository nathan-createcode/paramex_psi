"use client"

import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./supabase/supabase"
import LandingPage from "./pages/landing-page"
import LoginPage from "./pages/login-page"
import RegisterPage from "./pages/register-page"

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
        <Route path="/dashboard" element={!session ? <Navigate to="/login" /> : <div>Dashboard (akan dibuat)</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
