"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import { useState, useEffect, useRef } from "react"
import {
  Settings,
  BadgeHelp,
  LayoutDashboard,
  ClipboardCheck,
  BrainCircuit,
  BotMessageSquare,
  ChevronLeft,
  LogOut,
} from "lucide-react"

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevOpen = useRef(open)

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Project",
      href: "/projects",
      icon: ClipboardCheck,
    },
    {
      name: "DSS & AI",
      href: "/dss",
      icon: BrainCircuit,
    },
    {
      name: "Project Advisor",
      href: "/project-advisor",
      icon: BotMessageSquare,
    },
  ]

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error("Error getting user:", error)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    if (prevOpen.current !== open) {
      setIsTransitioning(true)
      prevOpen.current = open
    }
  }, [open])

  const handleTransitionEnd = () => {
    setIsTransitioning(false)
  }

  // Helper function to get user initials
  const getUserInitials = (user) => {
    if (!user) return "U"

    const fullName = user.user_metadata?.full_name
    if (fullName) {
      const names = fullName.trim().split(" ")
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    // Fallback to email
    if (user.email) {
      return user.email[0].toUpperCase()
    }

    return "U"
  }

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (!user) return "User"
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  }

  const secondaryItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      description: "App preferences, theme, notifications",
    },
    {
      name: "Help",
      href: "/help",
      icon: BadgeHelp,
      description: "Documentation, support, tutorials",
    },
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isActive = (href) => location.pathname === href

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-50 ${
        open ? "w-[280px]" : "w-20"
      } ${isTransitioning ? "overflow-hidden" : "overflow-visible"}`}
      style={{
        boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Header */}
      <div className="h-16 p-4 border-b border-gray-100 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center p-2"
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
              }}
            >
              <img
                src="/src/assets/logo.png"
                alt="logo"
                width="32"
                height="32"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            {open && <h1 className="text-xl font-bold text-gray-800 m-0">Flowtica</h1>}
          </div>
          <button
            onClick={() => setOpen(!open)}
            className={`absolute top-[50px] z-[100] rounded-full p-0 border-none bg-white transition-all duration-300 ${
              open ? "left-[264px]" : "left-[60px]"
            }`}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            <div
              className="w-[35px] h-[35px] rounded-full flex items-center justify-center"
              style={{
                background: open ? "#FFFFFF" : "#F3F4F6",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <ChevronLeft
                size={18}
                color="#6B7280"
                className={`transition-transform duration-500 ${open ? "rotate-0" : "rotate-180"}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {open && (
            <div className="p-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider m-0">MAIN MENU</h2>
            </div>
          )}
          {navItems.map((item) => {
            const IconComponent = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out text-left w-full ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                style={{
                  boxShadow: active
                    ? "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)"
                    : "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
                }}
                title={!open ? item.name : undefined}
              >
                <IconComponent size={20} color={active ? "#3B82F6" : "currentColor"} />
                {open && <span className="flex-1">{item.name}</span>}
              </button>
            )
          })}
        </div>

        {/* Secondary Navigation */}
        <div className="flex flex-col gap-1">
          {open && (
            <div className="p-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider m-0">OTHER</h2>
            </div>
          )}
          {secondaryItems.map((item) => {
            const IconComponent = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out text-left w-full ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                style={{
                  boxShadow: active
                    ? "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)"
                    : "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
                }}
                title={!open ? item.name : item.description}
              >
                <IconComponent size={20} color={active ? "#3B82F6" : "currentColor"} />
                {open && (
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span>{item.name}</span>
                    <span className="text-xs text-gray-400">{item.description}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* User Info Card */}
        {open && (
          <div className="pt-6">
            <div
              className="rounded-xl p-4 border border-gray-200"
              style={{
                background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
                boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                  }}
                >
                  <span className="text-white font-semibold text-sm">{getUserInitials(user)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {getDisplayName(user)}
                  </p>
                  <p className="text-xs text-gray-500 m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    Freelance Developer
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out w-full hover:bg-red-100 hover:border-red-300"
          style={{
            boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
          }}
          title={!open ? "Logout" : undefined}
        >
          <LogOut size={20} color="#EF4444" />
          {open && <span className="text-red-700">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
