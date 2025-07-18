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
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading help center...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Help Center</h1>
            <p style={styles.subtitle}>Find answers to your questions and learn how to use Flowtica effectively</p>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.content}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <nav style={styles.nav}>
              <h3 style={styles.navTitle}>Categories</h3>
              {helpSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    ...styles.navItem,
                    ...(activeSection === section.id ? styles.navItemActive : {}),
                  }}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {searchTerm ? (
              // Search Results
              <div>
                <h2 style={styles.sectionTitle}>Search Results for "{searchTerm}"</h2>

                {/* Articles Results */}
                {filteredSections.length > 0 && (
                  <div style={styles.searchResults}>
                    <h3 style={styles.resultsTitle}>Articles</h3>
                    {filteredSections.map((section) =>
                      section.articles
                        .filter(
                          (article) =>
                            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            article.content.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .map((article, index) => (
                          <div key={`${section.id}-${index}`} style={styles.searchResultItem}>
                            <h4 style={styles.resultTitle}>{article.title}</h4>
                            <p style={styles.resultCategory}>in {section.title}</p>
                            <p style={styles.resultContent}>{article.content}</p>
                          </div>
                        )),
                    )}
                  </div>
                )}

                {/* FAQ Results */}
                {filteredFAQ.length > 0 && (
                  <div style={styles.searchResults}>
                    <h3 style={styles.resultsTitle}>FAQ</h3>
                    {filteredFAQ.map((item, index) => (
                      <div key={index} style={styles.searchResultItem}>
                        <h4 style={styles.resultTitle}>{item.question}</h4>
                        <p style={styles.resultContent}>{item.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {filteredSections.length === 0 && filteredFAQ.length === 0 && (
                  <div style={styles.noResults}>
                    <SearchIcon />
                    <h3 style={styles.noResultsTitle}>No results found</h3>
                    <p style={styles.noResultsText}>Try different keywords or browse the categories on the left.</p>
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
                      <div style={styles.sectionHeader}>
                        {section.icon}
                        <h2 style={styles.sectionTitle}>{section.title}</h2>
                      </div>

                      <div style={styles.articlesList}>
                        {section.articles.map((article, index) => (
                          <div key={index} style={styles.articleCard}>
                            <h3 style={styles.articleTitle}>{article.title}</h3>
                            <p style={styles.articleContent}>{article.content}</p>
                            <button style={styles.readMoreButton}>
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
                  <div style={styles.faqSection}>
                    <h2 style={styles.faqTitle}>
                      <QuestionIcon />
                      Frequently Asked Questions
                    </h2>
                    <div style={styles.faqList}>
                      {faqItems.slice(0, 3).map((item, index) => (
                        <div key={index} style={styles.faqItem}>
                          <h4 style={styles.faqQuestion}>{item.question}</h4>
                          <p style={styles.faqAnswer}>{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact Support */}
            <div style={styles.supportSection}>
              <div style={styles.supportCard}>
                <div style={styles.supportHeader}>
                  <SupportIcon />
                  <h3 style={styles.supportTitle}>Still need help?</h3>
                </div>
                <p style={styles.supportText}>Can't find what you're looking for? Our support team is here to help.</p>
                <div style={styles.supportActions}>
                  <button style={styles.supportButton}>
                    <MailIcon />
                    Contact Support
                  </button>
                  <button style={styles.supportButtonSecondary}>
                    <ChatIcon />
                    Live Chat
                  </button>
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
    style={{
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
    }}
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

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: 0,
  },
  searchContainer: {
    marginBottom: "32px",
  },
  searchWrapper: {
    position: "relative",
    maxWidth: "500px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 44px",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    fontSize: "14px",
    backgroundColor: "white",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    outline: "none",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "32px",
    alignItems: "start",
  },
  sidebar: {
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    position: "sticky",
    top: "24px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 16px 0",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "transparent",
    color: "#6B7280",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    textAlign: "left",
    width: "100%",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  navItemActive: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #DBEAFE",
    boxShadow: "inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)",
  },
  mainContent: {
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    color: "#3B82F6",
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1F2937",
    margin: 0,
  },
  articlesList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  articleCard: {
    padding: "24px",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    backgroundColor: "#FAFAFA",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  articleTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 12px 0",
  },
  articleContent: {
    fontSize: "14px",
    color: "#6B7280",
    lineHeight: "1.6",
    margin: "0 0 16px 0",
  },
  readMoreButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  faqSection: {
    marginTop: "48px",
    paddingTop: "32px",
    borderTop: "1px solid #E5E7EB",
  },
  faqTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1F2937",
    margin: "0 0 24px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  faqItem: {
    padding: "20px",
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
  },
  faqQuestion: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 8px 0",
  },
  faqAnswer: {
    fontSize: "14px",
    color: "#6B7280",
    lineHeight: "1.6",
    margin: 0,
  },
  searchResults: {
    marginBottom: "32px",
  },
  resultsTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 16px 0",
  },
  searchResultItem: {
    padding: "20px",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    marginBottom: "16px",
    backgroundColor: "#FAFAFA",
  },
  resultTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 4px 0",
  },
  resultCategory: {
    fontSize: "12px",
    color: "#6B7280",
    margin: "0 0 8px 0",
    fontStyle: "italic",
  },
  resultContent: {
    fontSize: "14px",
    color: "#6B7280",
    lineHeight: "1.6",
    margin: 0,
  },
  noResults: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    textAlign: "center",
  },
  noResultsTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    margin: "16px 0 8px 0",
  },
  noResultsText: {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  },
  supportSection: {
    marginTop: "48px",
    paddingTop: "32px",
    borderTop: "1px solid #E5E7EB",
  },
  supportCard: {
    padding: "32px",
    backgroundColor: "#F0F9FF",
    borderRadius: "16px",
    border: "1px solid #BAE6FD",
    textAlign: "center",
  },
  supportHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  supportTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1F2937",
    margin: 0,
  },
  supportText: {
    fontSize: "14px",
    color: "#6B7280",
    margin: "0 0 24px 0",
    lineHeight: "1.6",
  },
  supportActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  supportButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  supportButtonSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "white",
    color: "#3B82F6",
    border: "1px solid #3B82F6",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
}

export default Help