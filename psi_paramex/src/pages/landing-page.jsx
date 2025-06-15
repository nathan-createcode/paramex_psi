"use client"
import { useState } from "react"
import { Link } from "react-router-dom"
import FeatureCard from "../components/feature-card"
import { GridIcon, ClockIcon, MapPinIcon } from "../components/icons"

const LandingPage = () => {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscriptionMessage, setSubscriptionMessage] = useState("")

  // Data fitur
  const features = [
    {
      title: "Project Visualization",
      description: "Get a clear overview of all your projects with intuitive charts and dashboards.",
      icon: <GridIcon className="text-gray-700" />,
    },
    {
      title: "Decision Support System",
      description: "Prioritize your projects based on deadline, payment, and difficulty with our intelligent DSS.",
      icon: <ClockIcon className="text-gray-700" />,
    },
    {
      title: "AI Recommendations",
      description: "Receive intelligent suggestions to optimize your workflow and increase productivity.",
      icon: <MapPinIcon className="text-gray-700" />,
    },
  ]

  // Fungsi untuk handle newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    setIsSubscribing(true)
    setSubscriptionMessage("")

    try {
      // Simulasi API call - Anda bisa mengganti dengan API yang sebenarnya
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Validasi email sederhana
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address")
      }

      setSubscriptionMessage("Thank you for subscribing! You'll receive updates soon.")
      setEmail("")
    } catch (error) {
      setSubscriptionMessage(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm p-2">
            <img
              src="/src/assets/logo.png"
              alt="logo"
              width="32"
              height="32"
              className="w-full h-full object-contain filter brightness-0 invert"
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">Flowtica</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full border border-gray-200 text-gray-800 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
              Manage your freelance projects smarter with MIS, DSS & AI
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Streamline your workflow, prioritize tasks intelligently, and make data-driven decisions with our
              AI-powered project management platform designed specifically for freelancers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all font-medium shadow-sm hover:shadow-md"
              >
                Get Started
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-all font-medium shadow-sm hover:shadow-md"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-md aspect-square p-8 border border-gray-100 rounded-3xl shadow-sm">
              <img
                src="/placeholder.svg?height=400&width=400"
                alt="AI-powered project management"
                width="400"
                height="400"
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to streamline your freelance work?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of freelancers who are already using our platform to manage their projects more efficiently.
        </p>
        <Link
          to="/register"
          className="px-8 py-4 rounded-full bg-black text-white hover:bg-gray-800 transition-all font-medium shadow-sm hover:shadow-md inline-block"
        >
          Start Free Trial
        </Link>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm p-1.5">
                  <img
                    src="/src/assets/logo.png"
                    alt="logo"
                    width="28"
                    height="28"
                    className="w-full h-full object-contain filter brightness-0 invert"
                  />
                </div>
                <span className="text-xl font-bold text-gray-900">Flowtica</span>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Empowering freelancers with intelligent project management, AI-driven insights, and seamless workflow
                optimization.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="h-10 w-10 rounded-xl bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-center text-gray-600 hover:text-blue-600"
                  aria-label="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-xl bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-center text-gray-600 hover:text-blue-600"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-xl bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-center text-gray-600 hover:text-blue-600"
                  aria-label="GitHub"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Press Kit
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Status Page
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Report Bug
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay updated</h3>
                <p className="text-gray-600">Get the latest updates, tips, and insights delivered to your inbox.</p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
            {subscriptionMessage && (
              <div
                className={`mt-4 p-3 rounded-lg ${subscriptionMessage.includes("Thank you") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
              >
                {subscriptionMessage}
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">© {new Date().getFullYear()} Flowtica. All rights reserved.</div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage