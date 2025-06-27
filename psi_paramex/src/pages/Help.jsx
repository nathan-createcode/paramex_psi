"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const Help = () => {
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("getting-started")
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session) {
          navigate("/login")
          return
        }

        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        navigate("/login")
      }
    }

    checkAuth()
  }, [navigate])

  const helpSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <PlayIcon />,
      articles: [
        {
          title: "Welcome to Flowtica",
          content: "Learn the basics of using Flowtica for your freelance project management needs.",
        },
        {
          title: "Setting Up Your First Project",
          content: "Step-by-step guide to create and configure your first project in the system.",
        },
        {
          title: "Understanding the Dashboard",
          content: "Overview of the main dashboard features and how to interpret the data visualizations.",
        },
      ],
    },
    {
      id: "projects",
      title: "Project Management",
      icon: <ProjectIcon />,
      articles: [
        {
          title: "Creating and Managing Projects",
          content: "Complete guide to project creation, editing, and status management.",
        },
        {
          title: "Project Status Workflow",
          content: "Understanding the different project statuses: On-Plan, On-Process and Done.",
        },
        {
          title: "Setting Deadlines and Priorities",
          content: "Best practices for setting realistic deadlines and managing project priorities.",
        },
      ],
    },
    {
      id: "dss",
      title: "Decision Support System",
      icon: <ChartIcon />,
      articles: [
        {
          title: "How DSS Works",
          content: "Understanding the Decision Support System and how it helps prioritize your projects.",
        },
        {
          title: "Configuring Priority Weights",
          content: "Learn how to adjust deadline, payment, and difficulty weights for optimal project prioritization.",
        },
        {
          title: "Interpreting DSS Results",
          content: "How to read and act on the priority scores and recommendations provided by the DSS.",
        },
      ],
    },
    {
      id: "ai-advisor",
      title: "AI Project Advisor",
      icon: <AIIcon />,
      articles: [
        {
          title: "Using the AI Advisor",
          content: "Get the most out of your AI Project Advisor for project management insights.",
        },
        {
          title: "Best Questions to Ask",
          content: "Examples of effective questions to get valuable advice from the AI system.",
        },
        {
          title: "AI Limitations and Best Practices",
          content: "Understanding what the AI can and cannot do, and how to use it effectively.",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: <ToolIcon />,
      articles: [
        {
          title: "Common Issues and Solutions",
          content: "Quick fixes for the most common problems users encounter.",
        },
        {
          title: "Data Sync Problems",
          content: "What to do when your data isn't syncing properly across devices.",
        },
        {
          title: "Performance Optimization",
          content: "Tips to improve app performance and loading times.",
        },
      ],
    },
  ]

  const faqItems = [
    {
      question: "How do I reset my password?",
      answer:
        "You can reset your password by clicking the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password.",
    },
    {
      question: "Can I export my project data?",
      answer:
        "Yes, you can export your project data from the Settings page. Click on 'Export Data' to download your projects in CSV format.",
    },
    {
      question: "How does the AI Project Advisor work?",
      answer:
        "The AI Project Advisor uses machine learning to provide personalized recommendations based on your project history, current workload, and industry best practices.",
    },
    {
      question: "What happens to my data if I delete my account?",
      answer:
        "When you delete your account, all your data including projects, settings, and chat history will be permanently removed from our servers within 30 days.",
    },
    {
      question: "Can I collaborate with team members?",
      answer:
        "Currently, Flowtica is designed for individual freelancers. Team collaboration features are planned for future releases.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, we use industry-standard encryption and security measures to protect your data. All data is encrypted in transit and at rest.",
    },
  ]

  const filteredSections = helpSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.articles.some(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  const filteredFAQ = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Loading help center...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-lg text-gray-600 leading-relaxed">Find answers to your questions and learn how to use Flowtica effectively</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="max-w-lg relative">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-xl bg-white shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-md/5 border border-gray-100 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {helpSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors font-medium text-sm ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-8 shadow-md/5 border border-gray-100">
              {searchTerm ? (
                // Search Results
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Results for "{searchTerm}"</h2>

                  {/* Articles Results */}
                  {filteredSections.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles</h3>
                      <div className="space-y-4">
                        {filteredSections.map((section) =>
                          section.articles
                            .filter(
                              (article) =>
                                article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                article.content.toLowerCase().includes(searchTerm.toLowerCase()),
                            )
                            .map((article, index) => (
                              <div key={`${section.id}-${index}`} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                                <p className="text-xs text-blue-600 mb-2">in {section.title}</p>
                                <p className="text-sm text-gray-600">{article.content}</p>
                              </div>
                            )),
                        )}
                      </div>
                    </div>
                  )}

                  {/* FAQ Results */}
                  {filteredFAQ.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQ</h3>
                      <div className="space-y-4">
                        {filteredFAQ.map((item, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-2">{item.question}</h4>
                            <p className="text-sm text-gray-600">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredSections.length === 0 && filteredFAQ.length === 0 && (
                    <div className="text-center py-12">
                      <SearchIcon />
                      <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">No results found</h3>
                      <p className="text-gray-600">Try different keywords or browse the categories on the left.</p>
                    </div>
                  )}
                </div>
              ) : (
                // Category Content
                <div>
                  {helpSections
                    .filter((section) => section.id === activeSection)
                    .map((section) => (
                      <div key={section.id}>
                        <div className="flex items-center gap-3 mb-6 text-blue-600">
                          {section.icon}
                          <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                        </div>

                        <div className="space-y-4">
                          {section.articles.map((article, index) => (
                            <div key={index} className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">{article.title}</h3>
                              <p className="text-gray-600 mb-4 leading-relaxed">{article.content}</p>
                              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                                Read More
                                <ArrowIcon />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                  {/* FAQ Section */}
                  {activeSection === "getting-started" && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <QuestionIcon />
                        Frequently Asked Questions
                      </h2>
                      <div className="space-y-4">
                        {faqItems.slice(0, 3).map((item, index) => (
                          <div key={index} className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="font-semibold text-gray-900 mb-2">{item.question}</h4>
                            <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Support */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 text-center">
                  <div className="flex justify-center mb-4">
                    <SupportIcon />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Still need help?</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">Can't find what you're looking for? Our support team is here to help.</p>
                  <div className="flex gap-4 justify-center">
                    <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium">
                      <MailIcon />
                      Contact Support
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors font-medium">
                      <ChatIcon />
                      Live Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Icon Components
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5,3 19,12 5,21" />
  </svg>
)

const ProjectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const AIIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
    <path d="M8.5 8.5v.01" />
    <path d="M16 15.5v.01" />
    <path d="M12 12v.01" />
  </svg>
)

const ToolIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6B7280"
    strokeWidth="2"
    className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
)

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const QuestionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <point cx="12" cy="17" />
  </svg>
)

const SupportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export default Help
