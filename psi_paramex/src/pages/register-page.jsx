"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabase/supabase"

const RegisterPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null) // Untuk debugging

  // Fungsi untuk validasi email
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(String(email).toLowerCase())
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setDebugInfo(null)

    // Validasi email terlebih dahulu
    if (!validateEmail(email)) {
      setError("Format email tidak valid. Pastikan email Anda benar.")
      setLoading(false)
      return
    }

    try {
      // Pendekatan 1: Coba daftar dengan metode normal
      console.log("Attempting to register with:", { email: email.trim(), password, name })

      // Mendaftarkan user dengan Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name || "", // Pastikan nilai kosong jika tidak ada nama
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      // Simpan info debug
      setDebugInfo({
        signUpResponse: { data, error: signUpError ? signUpError.message : null },
      })

      if (signUpError) {
        console.error("Signup error details:", signUpError)

        // Pendekatan 2: Jika pendaftaran normal gagal, coba pendekatan alternatif
        if (signUpError.message.includes("Database error")) {
          // Coba daftar tanpa metadata dulu
          const { data: altData, error: altError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
            },
          })

          setDebugInfo((prev) => ({
            ...prev,
            alternativeSignUp: { data: altData, error: altError ? altError.message : null },
          }))

          if (altError) {
            throw new Error(`Pendaftaran gagal: ${altError.message}`)
          }

          // Jika berhasil, coba tambahkan data user secara manual
          if (altData?.user?.id) {
            const { error: insertError } = await supabase.from("users").insert([
              {
                user_id: altData.user.id,
                email: email.trim(),
                name: name || "",
              },
            ])

            setDebugInfo((prev) => ({
              ...prev,
              manualInsert: { error: insertError ? insertError.message : null },
            }))

            if (insertError) {
              console.error("Manual insert error:", insertError)
              // Tetap lanjutkan karena auth sudah berhasil
            }
          }

          // Anggap pendaftaran berhasil jika auth berhasil
          setSuccessMessage("Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.")

          // Tunggu sebentar sebelum redirect
          setTimeout(() => {
            window.location.href = "/login"
          }, 3000)

          return
        } else {
          throw signUpError
        }
      }

      // Jika registrasi berhasil
      setSuccessMessage("Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.")

      // Tunggu sebentar sebelum redirect
      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)
    } catch (error) {
      console.error("Full error object:", error)

      // Pesan error yang lebih user-friendly
      if (error.message.includes("Database error")) {
        setError("Terjadi kesalahan pada database. Silakan coba lagi nanti atau hubungi administrator.")
      } else if (error.message.includes("User already registered")) {
        setError("Email ini sudah terdaftar. Silakan login atau gunakan email lain.")
      } else if (error.message.includes("Password should be at least")) {
        setError("Password terlalu pendek. Gunakan minimal 6 karakter.")
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Ilustrasi - Bagian Kiri */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center">
        <div className="p-12 flex items-center justify-center">
          {/* Placeholder untuk ilustrasi */}
          <div className="w-full max-w-md h-96 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
            Ilustrasi akan ditempatkan di sini
          </div>
        </div>
      </div>

      {/* Form Register - Bagian Kanan */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <h1 className="text-3xl font-bold mb-3 text-gray-800">Create new account</h1>
        <p className="text-gray-600 mb-10">Sign up to start managing your project</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-8">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Coba gunakan email dengan domain yang berbeda seperti gmail.com atau outlook.com.
            </p>
          </div>
        )}

        {successMessage && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-8">{successMessage}</div>}

        {/* Debug info - hanya tampilkan saat development */}
        {debugInfo && import.meta.env.DEV && (
          <div className="bg-gray-50 p-3 rounded-lg mb-8 text-xs overflow-auto max-h-40">
            <p className="font-medium">Debug Info:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-8">
            <label htmlFor="name" className="block text-gray-700 mb-3">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="mb-8">
            <label htmlFor="email" className="block text-gray-700 mb-3">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email"
              className={`w-full px-4 py-3 rounded-lg border ${
                email && !validateEmail(email) ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-gray-200`}
              required
            />
            {email && !validateEmail(email) && <p className="mt-1 text-sm text-red-600">Format email tidak valid</p>}
            <p className="mt-1 text-xs text-gray-500">
              Gunakan email dengan domain populer seperti gmail.com atau outlook.com
            </p>
          </div>

          <div className="mb-10">
            <label htmlFor="password" className="block text-gray-700 mb-3">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Your Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">Minimal 6 karakter</p>
          </div>

          {/* Tombol dengan desain yang konsisten dengan landing page */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-black text-white shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff] hover:bg-black/90 transition-colors"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-600">
          Have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
