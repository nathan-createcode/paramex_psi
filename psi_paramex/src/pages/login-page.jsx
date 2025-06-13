"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import LogoFrame from "../components/ui/logo-frame"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Jika login berhasil, arahkan ke dashboard menggunakan React Router
      navigate("/dashboard")
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Form Login - Bagian Kiri */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="mb-10 flex items-center">
          <LogoFrame className="mr-2" />
          <span className="text-xl font-medium">Flowtica</span>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-gray-800">Login to your account</h1>
        <p className="text-gray-600 mb-10">Enter your email and password to login</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-8">{error}</div>}

        <form onSubmit={handleLogin}>
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="mb-4">
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
            />
          </div>

          <div className="mb-10">
            <Link to="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Tombol dengan desain yang konsisten dengan landing page */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-black text-white shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff] hover:bg-black/90 transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* Ilustrasi - Bagian Kanan */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center">
        {/*
          CATATAN UNTUK ILUSTRASI:

          1. Letakkan ilustrasi Anda di folder public, misalnya: public/images/login-illustration.png
          2. Kemudian gunakan kode di bawah ini (hapus komentar):

          <img
            src="/images/login-illustration.png"
            alt="Login Illustration"
            className="max-w-md w-full h-auto object-contain"
          />

          3. Untuk mengatur ukuran ilustrasi:
             - Ubah max-w-md untuk mengatur lebar maksimum (md=28rem, lg=32rem, xl=36rem, 2xl=42rem)
             - Tambahkan class p-8, p-12, dll untuk menambahkan padding di sekitar ilustrasi
             - Gunakan h-auto untuk menjaga rasio aspek gambar

          4. Jika ilustrasi memiliki background transparan dan Anda ingin mengubah warna background:
             - Tambahkan class bg-purple-100, bg-indigo-50, dll pada div parent
        */}
        <div className="p-12 flex items-center justify-center">
          {/* Placeholder untuk ilustrasi */}
          <div className="w-full max-w-md h-96 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
            Ilustrasi akan ditempatkan di sini
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
