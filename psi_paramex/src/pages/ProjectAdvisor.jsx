"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const ProjectAdvisor = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content:
                        "Hello! I'm your AI Project Advisor powered by Meta Llama. I can help you with project management strategies, prioritization, time management, and workflow optimization. I'm connected to advanced AI capabilities to provide you with intelligent, personalized advice. What would you like to discuss today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
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

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Call Groq AI API for real AI responses
  const generateAIResponse = async (userMessage, conversationHistory) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error calling AI API:', error)
      return "I apologize, but I'm currently unable to connect to my AI brain. Please check that the backend server is running and try again. In the meantime, I recommend breaking your project into smaller, manageable tasks for better organization."
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = inputMessage.trim()
    setInputMessage("")
    setIsTyping(true)

    try {
      // Get AI response from Groq API
      const aiResponseContent = await generateAIResponse(messageText, messages)
      
      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: aiResponseContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: "I apologize, but I'm experiencing technical difficulties. Please ensure the backend server is running and try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "How do I prioritize multiple urgent projects?",
    "What's the best way to estimate project timelines?",
    "How can I improve client communication?",
    "Tips for managing project scope creep?",
    "How to handle difficult project deadlines?",
    "Best practices for freelance project management?",
  ]

  const handleQuickQuestion = async (question) => {
    // Immediately send the quick question
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: question,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Get AI response for quick question
      const aiResponseContent = await generateAIResponse(question, messages)
      
      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: aiResponseContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error('Error getting AI response for quick question:', error)
      const errorResponse = {
        id: Date.now() + 1,
        type: "ai",
        content: "I apologize, but I'm experiencing technical difficulties. Please ensure the backend server is running and try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading Project Advisor...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerInfo}>
              <h1 style={styles.title}>
                <AIIcon />
                AI Project Advisor
              </h1>
              <p style={styles.subtitle}>Get intelligent advice for your freelance project management challenges</p>
            </div>
            <div style={styles.statusIndicator}>
              <div style={styles.statusDot}></div>
              <span style={styles.statusText}>Meta Llama AI Online</span>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div style={styles.chatContainer}>
          {/* Messages */}
          <div style={styles.messagesContainer}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...styles.messageWrapper,
                  justifyContent: message.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={styles.messageGroup}>
                  {message.type === "ai" && (
                    <div style={styles.aiAvatar}>
                      <AIIcon />
                    </div>
                  )}
                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(message.type === "user" ? styles.userMessage : styles.aiMessage),
                    }}
                  >
                    <p style={styles.messageContent}>{message.content}</p>
                    <span style={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {message.type === "user" && (
                    <div style={styles.userAvatar}>
                      <UserIcon />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={styles.messageWrapper}>
                <div style={styles.messageGroup}>
                  <div style={styles.aiAvatar}>
                    <AIIcon />
                  </div>
                  <div style={{ ...styles.messageBubble, ...styles.aiMessage }}>
                    <div style={styles.typingIndicator}>
                      <div style={styles.typingDot}></div>
                      <div style={styles.typingDot}></div>
                      <div style={styles.typingDot}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={styles.quickQuestionsContainer}>
              <h3 style={styles.quickQuestionsTitle}>Quick Questions</h3>
              <div style={styles.quickQuestionsList}>
                {quickQuestions.map((question, index) => (
                  <button key={index} onClick={() => handleQuickQuestion(question)} style={styles.quickQuestionButton}>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about project management..."
                style={styles.messageInput}
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                style={{
                  ...styles.sendButton,
                  ...(!inputMessage.trim() || isTyping ? styles.sendButtonDisabled : {}),
                }}
              >
                <SendIcon />
              </button>
            </div>
            <p style={styles.inputHint}>Press Enter to send, Shift + Enter for new line</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Icon Components
const AIIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
    <path d="M8.5 8.5v.01" />
    <path d="M16 15.5v.01" />
    <path d="M12 12v.01" />
    <path d="M11 17v.01" />
    <path d="M7 14v.01" />
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    height: "calc(100vh - 48px)",
    display: "flex",
    flexDirection: "column",
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
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "24px 32px",
    marginBottom: "24px",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: 0,
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#ECFDF5",
    borderRadius: "20px",
    border: "1px solid #A7F3D0",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#10B981",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  statusText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#059669",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  messagesContainer: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  messageWrapper: {
    display: "flex",
    width: "100%",
  },
  messageGroup: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    maxWidth: "80%",
  },
  aiAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  messageBubble: {
    padding: "12px 16px",
    borderRadius: "18px",
    maxWidth: "100%",
    wordWrap: "break-word",
  },
  aiMessage: {
    backgroundColor: "#F3F4F6",
    color: "#1F2937",
    borderBottomLeftRadius: "6px",
  },
  userMessage: {
    backgroundColor: "#3B82F6",
    color: "white",
    borderBottomRightRadius: "6px",
  },
  messageContent: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  messageTime: {
    fontSize: "12px",
    opacity: 0.7,
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
  },
  typingDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#6B7280",
    borderRadius: "50%",
    animation: "typing 1.4s infinite ease-in-out",
  },
  quickQuestionsContainer: {
    padding: "24px",
    borderTop: "1px solid #F3F4F6",
  },
  quickQuestionsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 16px 0",
  },
  quickQuestionsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
  },
  quickQuestionButton: {
    padding: "12px 16px",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.05), -3px -3px 6px rgba(255, 255, 255, 0.8)",
  },
  inputContainer: {
    padding: "24px",
    borderTop: "1px solid #F3F4F6",
  },
  inputWrapper: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  messageInput: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  sendButton: {
    padding: "12px",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.05), -6px -6px 12px rgba(255, 255, 255, 0.8)",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
    cursor: "not-allowed",
  },
  inputHint: {
    fontSize: "12px",
    color: "#6B7280",
    margin: "8px 0 0 0",
    textAlign: "center",
  },
}

// Add CSS animations
const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }

  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
`
document.head.appendChild(styleSheet)

export default ProjectAdvisor
