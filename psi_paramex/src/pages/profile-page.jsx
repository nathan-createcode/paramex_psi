"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"

const ProfilePage = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Ambil sesi pengguna saat ini
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

        // Ambil data profil dari tabel public.users
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError
        }

        setProfile(profileData || {})
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProfile()
  }, [navigate])

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profile.name,
          phone_number: profile.phone_number,
          updated_at: new Date(),
        })
        .eq("id", user.id)

      if (error) throw error

      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff]">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <form onSubmit={updateProfile}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={profile?.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="mb-8">
            <label htmlFor="phone" className="block text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={profile?.phone_number || ""}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-xl bg-black text-white shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff] hover:bg-black/90 transition-colors"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            navigate("/login")
          }}
          className="w-full mt-4 px-4 py-2 rounded-xl border border-gray-200 text-gray-800 shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff] hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
