"use client"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import gambarLogin from "../assets/gambar_login.png"

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
      navigate("/dashboard")
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white">
      {/* Tombol kecil gradasi biru-ungu di pojok kiri atas */}
      <button onClick={() => navigate("/")} className="back-to-landing-button">
        ← Landing Page
      </button>

      <div className="flex flex-col lg:flex-row w-full max-w-6xl p-4 lg:p-0">
        {/* Form Login */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 py-12">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-3xl font-bold mb-1 text-gray-800">Login to your account</h1>
            <p className="text-gray-600 mb-8 text-sm">Enter your email and password to login</p>
            {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <label htmlFor="email" className="block text-gray-700 mb-2 text-sm">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 mb-2 text-sm">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6 text-sm">
                <Link to="#" className="text-gray-500 hover:text-gray-700">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:bg-gray-900 transition"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
        {/* Gambar Login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <img src={gambarLogin || "/placeholder.svg"} alt="Login Illustration" className="login-image" />
        </div>
      </div>

      <style jsx>{`
        /* Back to Landing Button - Fixed Size */
        .back-to-landing-button {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: white;
          font-weight: 500;
          border-radius: 0.375rem;
          background-color: black;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
          z-index: 10;
        }

        .back-to-landing-button:hover {
          background-color: #374151;
        }

        /* Mobile Styles (Default) */
        .login-image {
          width: 100%;
          max-width: 300px;
          height: auto;
          object-fit: contain;
          margin: 1rem 0;
        }

        /* Tablet Styles */
        @media (min-width: 640px) {
          .login-image {
            max-width: 400px;
          }
        }

        /* Desktop Styles */
        @media (min-width: 1024px) {
          .back-to-landing-button {
            top: 1.5rem;
            left: 1.5rem;
            padding: 0.75rem 1.25rem;
            font-size: 0.875rem;
          }

          .login-image {
            width: 80%;
            max-width: 500px;
            height: auto;
            object-fit: contain;
          }
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 1023px) {
          /* Stack form and image vertically on mobile/tablet */
          .flex.flex-col.lg\\:flex-row {
            flex-direction: column;
          }

          /* Adjust form section */
          .w-full.lg\\:w-1\\/2:first-child {
            width: 100%;
            padding: 2rem 1.5rem;
          }

          /* Adjust image section */
          .w-full.lg\\:w-1\\/2:last-child {
            width: 100%;
            order: -1; /* Put image above form on mobile */
            padding: 1rem;
          }

          /* Adjust form container */
          .max-w-md {
            max-width: 100%;
          }

          /* Adjust title size on mobile */
          .text-3xl {
            font-size: 1.875rem;
          }
        }

        /* Small Mobile Styles */
        @media (max-width: 480px) {
          .back-to-landing-button {
            padding: 0.625rem 0.875rem;
            font-size: 0.8125rem;
          }

          /* Further reduce padding on small screens */
          .w-full.lg\\:w-1\\/2:first-child {
            padding: 1.5rem 1rem;
          }

          /* Smaller title */
          .text-3xl {
            font-size: 1.5rem;
          }

          /* Smaller image */
          .login-image {
            max-width: 250px;
          }

          /* Adjust form inputs */
          .px-4.py-3 {
            padding: 0.75rem 1rem;
          }
        }

        /* Large Desktop Styles */
        @media (min-width: 1280px) {
          .back-to-landing-button {
            padding: 0.875rem 1.5rem;
            font-size: 0.9375rem;
          }

          .login-image {
            width: 70%;
            max-width: 600px;
          }
        }

        /* Ensure proper spacing and alignment */
        @media (max-width: 1023px) {
          .min-h-screen {
            padding: 1rem 0;
          }

          .flex.items-center.justify-center {
            align-items: flex-start;
            padding-top: 2rem;
          }
        }

        /* Fix container width on mobile */
        @media (max-width: 1023px) {
          .max-w-6xl {
            max-width: 100%;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
