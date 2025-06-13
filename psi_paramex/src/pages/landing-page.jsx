"use client"
import { Link } from "react-router-dom"
import FeatureCard from "../components/feature-card"
import { GridIcon, ClockIcon, MapPinIcon } from "../components/icons"
import LogoFrame from "../components/ui/logo-frame"

const LandingPage = () => {
  // Data fitur
  const features = [
    {
      title: "Project Visualization",
      description: "Get a clear overview of all your projects with intuitive charts and dashboards.",
      icon: <GridIcon className="text-black" />,
    },
    {
      title: "Decision Support System",
      description: "Prioritize your projects based on deadline, payment, and difficulty with our intelligent DSS.",
      icon: <ClockIcon className="text-black" />,
    },
    {
      title: "AI Recommendations",
      description: "Receive intelligent suggestions to optimize your workflow and increase productivity.",
      icon: <MapPinIcon className="text-black" />,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-12 flex justify-between items-center mb-16">
        <div className="flex items-center gap-2">
          <LogoFrame className="mr-2" />
          <h1 className="text-2xl font-bold">Flowtica</h1>
        </div>
        <div className="flex gap-4">
          {/* Menggunakan Link dari React Router */}
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-800 shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff]"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-black text-white shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff]"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold mb-6">Manage your freelance projects smarter with DSS & AI</h2>
          <p className="text-lg text-gray-600 mb-8">
            Streamline your workflow, prioritize tasks intelligently, and make data-driven decisions with our AI-powered
            project management platform designed specifically for freelancers.
          </p>
          <div className="flex gap-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-black text-white text-lg shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff]"
            >
              Get Started
            </Link>
            <button className="px-6 py-3 rounded-xl border border-gray-200 text-gray-800 text-lg shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff]">
              Learn More
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-md aspect-square rounded-3xl p-4 flex items-center justify-center bg-white shadow-[6px_6px_12px_#e8e8e8,_-6px_-6px_12px_#ffffff]">
            <img
              src="/placeholder.svg?height=400&width=400"
              alt="Project Management Illustration"
              className="rounded-2xl w-full h-full object-contain"
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
      </section>

      {/* Extra space at bottom */}
      {/* <div className="h-20"></div> */}
    </div>
  )
}

export default LandingPage
