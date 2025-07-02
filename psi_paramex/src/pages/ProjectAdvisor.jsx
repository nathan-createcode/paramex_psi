"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"

const ProjectAdvisor = () => {
  // Load messages from localStorage or use default
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem('projectAdvisorMessages')
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        // Convert timestamp strings back to Date objects
        return parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Error loading saved messages:', error)
    }
    
    // Default message if no saved messages or error
    return [
      {
        id: 1,
        type: "ai",
        content: "Hello! I'm your AI Project Advisor powered by Meta Llama. I can help you with project management strategies, prioritization, time management, and workflow optimization. I have access to your current projects and can provide personalized advice based on your actual workload, deadlines, and project mix. What would you like to discuss today?",
        timestamp: new Date(),
      },
    ]
  })
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealingMessageId, setRevealingMessageId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animatingMessages, setAnimatingMessages] = useState(new Set())
  const [userId, setUserId] = useState(null)
  const [userProjects, setUserProjects] = useState([])
  const messagesEndRef = useRef(null)
  const typewriterTimeoutRef = useRef(null)
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

        setUserId(session.user.id)
        // Fetch user projects for AI context
        await fetchUserProjects(session.user.id)
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current)
      }
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('projectAdvisorMessages', JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving messages to localStorage:', error)
    }
  }, [messages])

  // Function to clear chat history
  const clearChatHistory = () => {
    const defaultMessage = {
      id: 1,
      type: "ai",
      content: `Hello! I'm your AI Project Advisor. I can help you with project management strategies, prioritization, time management, and workflow optimization.${userProjects.length > 0 ? ` I have access to your ${userProjects.length} current project${userProjects.length !== 1 ? 's' : ''} and can provide personalized advice.` : ''}`,
      timestamp: new Date(),
    }
    setMessages([defaultMessage])
    localStorage.removeItem('projectAdvisorMessages')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Function to fetch user projects for AI context
  const fetchUserProjects = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/user-projects/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserProjects(data.projects || [])
        console.log('Loaded projects for AI context:', data.projects?.length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch user projects:', error)
    }
  }

  // Typewriter effect function
  const typewriterEffect = (text, messageId, delay = 0.5) => {
    return new Promise((resolve) => {
      let currentIndex = 0
      setIsRevealing(true)
      setRevealingMessageId(messageId)
      
      const typeNextChar = () => {
        if (currentIndex <= text.length) {
          const partialText = text.substring(0, currentIndex)
          
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: partialText, isRevealing: currentIndex < text.length }
              : msg
          ))
          
          currentIndex++
          
          if (currentIndex <= text.length) {
            typewriterTimeoutRef.current = setTimeout(typeNextChar, delay)
          } else {
            setIsRevealing(false)
            setRevealingMessageId(null)
            resolve()
          }
        }
      }
      
      typeNextChar()
    })
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
          conversation_history: conversationHistory,
          user_id: userId  // Send user ID for project context
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
    if (!inputMessage.trim() || isTyping) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    // Add animation for new user message
    setAnimatingMessages(prev => new Set([...prev, userMessage.id]))
    setMessages((prev) => [...prev, userMessage])
    
    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(userMessage.id)
        return newSet
      })
    }, 500)

    const messageText = inputMessage.trim()
    setInputMessage("")
    setIsTyping(true)

    try {
      // Get AI response from Groq API
      const aiResponseContent = await generateAIResponse(messageText, messages)
      
      // Create initial empty AI message
      const aiResponseId = Date.now() + 1
      const aiResponse = {
        id: aiResponseId,
        type: "ai",
        content: "",
        timestamp: new Date(),
        isRevealing: true,
      }

      // Add animation for new AI message
      setAnimatingMessages(prev => new Set([...prev, aiResponseId]))
      
      // Add empty message first
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)

      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(aiResponseId)
          return newSet
        })
      }, 500)

      // Start typewriter effect
      await typewriterEffect(aiResponseContent, aiResponseId)
      
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorResponseId = Date.now() + 1
      const errorResponse = {
        id: errorResponseId,
        type: "ai",
        content: "",
        timestamp: new Date(),
        isRevealing: true,
      }
      
      // Add animation for error message
      setAnimatingMessages(prev => new Set([...prev, errorResponseId]))
      setMessages((prev) => [...prev, errorResponse])
      setIsTyping(false)
      
      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(errorResponseId)
          return newSet
        })
      }, 500)
      
      // Type out error message
      await typewriterEffect(
        "I apologize, but I'm experiencing technical difficulties. Please ensure the backend server is running and try again.",
        errorResponseId
      )
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
    if (isTyping || isRevealing) return
    
    // Immediately send the quick question
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: question,
      timestamp: new Date(),
    }

    // Add animation for new user message
    setAnimatingMessages(prev => new Set([...prev, userMessage.id]))
    setMessages((prev) => [...prev, userMessage])
    
    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(userMessage.id)
        return newSet
      })
    }, 500)

    setIsTyping(true)

    try {
      // Get AI response for quick question
      const aiResponseContent = await generateAIResponse(question, messages)
      
      // Create initial empty AI message
      const aiResponseId = Date.now() + 1
      const aiResponse = {
        id: aiResponseId,
        type: "ai",
        content: "",
        timestamp: new Date(),
        isRevealing: true,
      }

      // Add animation for new AI message
      setAnimatingMessages(prev => new Set([...prev, aiResponseId]))
      
      // Add empty message first
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)

      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(aiResponseId)
          return newSet
        })
      }, 500)

      // Start typewriter effect
      await typewriterEffect(aiResponseContent, aiResponseId)

    } catch (error) {
      console.error('Error getting AI response for quick question:', error)
      const errorResponseId = Date.now() + 1
      const errorResponse = {
        id: errorResponseId,
        type: "ai",
        content: "",
        timestamp: new Date(),
        isRevealing: true,
      }
      
      // Add animation for error message
      setAnimatingMessages(prev => new Set([...prev, errorResponseId]))
      setMessages((prev) => [...prev, errorResponse])
      setIsTyping(false)
      
      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(errorResponseId)
          return newSet
        })
      }, 500)
      
      // Type out error message
      await typewriterEffect(
        "I apologize, but I'm experiencing technical difficulties. Please ensure the backend server is running and try again.",
        errorResponseId
      )
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Project Advisor...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto" style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerInfo}>
              <h1 style={styles.title}>
                <AIIcon />
                AI Project Advisor
              </h1>
              <p style={styles.subtitle}>
                Get intelligent advice for your freelance project management challenges
                {userProjects.length > 0 && (
                  <span style={styles.projectContext}>
                    • AI has access to {userProjects.length} project{userProjects.length !== 1 ? 's' : ''} for personalized advice
                  </span>
                )}
              </p>
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
                className={animatingMessages.has(message.id) ? "message-slide-up" : ""}
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
                    <p style={styles.messageContent}>
                      {message.content}
                    </p>
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

            {/* Simple Loading Indicator - only show when waiting for AI response, not during reveal */}
            {isTyping && !isRevealing && (
              <div style={styles.simpleLoadingContainer}>
                <div style={styles.typingIndicator}>
                  <div style={styles.typingDot} className="typing-dot"></div>
                  <div style={styles.typingDot} className="typing-dot"></div>
                  <div style={styles.typingDot} className="typing-dot"></div>
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
                  <button 
                    key={index} 
                    onClick={() => handleQuickQuestion(question)} 
                    style={styles.quickQuestionButton} 
                    className="quickQuestionButton"
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#F3F4F6'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#F9FAFB'
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
              <button 
                onClick={clearChatHistory} 
                style={styles.clearButtonLeft}
                className="clearButton"
                title="Clear chat history"
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563EB'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3B82F6'
                }}
              >
                <ClearIcon />
              </button>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about project management..."
                style={styles.messageInput}
                rows={1}
                disabled={false}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                style={{
                  ...styles.sendButton,
                  ...(!inputMessage.trim() || isTyping ? styles.sendButtonDisabled : {}),
                }}
                onMouseEnter={(e) => {
                  if (!(!inputMessage.trim() || isTyping)) {
                    e.target.style.backgroundColor = '#2563EB'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!inputMessage.trim() || isTyping)) {
                    e.target.style.backgroundColor = '#3B82F6'
                  }
                }}
              >
                <SendIcon />
              </button>
            </div>
            <p style={styles.inputHint}>
              {isTyping || isRevealing ? (
                <>AI is responding... You can still type your next message. <strong>Chat history saved locally</strong></>
              ) : (
                <>Press Enter to send, Shift + Enter for new line, <strong>Chat history saved locally</strong></>
              )}
            </p>
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

const ClearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
)

const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
    marginBottom: "24px",
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
  projectContext: {
    display: "block",
    fontSize: "14px",
    color: "#10B981",
    fontWeight: "500",
    marginTop: "4px",
  },
  chatContainer: {
    backgroundColor: "transparent",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    maxWidth: "900px", // Increased from 700px for better screen utilization
    width: "100%", // Full width of parent
    margin: "0 auto",
    height: "calc(100vh - 240px)", // Responsive height based on viewport (reduced padding)
    minHeight: "750px", // Increased minimum height
  },
  messagesContainer: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: 0, // Allow flex shrinking
  },
  messageWrapper: {
    display: "flex",
    width: "100%",
  },
  messageGroup: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    maxWidth: "80%", // Increased from 70% for wider messages
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
  },
  simpleLoadingContainer: {
    display: "flex",
    justifyContent: "flex-start",
    marginLeft: "24px",
    padding: "16px 24px",
  },
  quickQuestionsContainer: {
    padding: "24px",
    flexShrink: 0, // Prevent quick questions from shrinking
    backgroundColor: "transparent", // Transparent background
  },
  quickQuestionsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 16px 0",
  },
  quickQuestionsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", // Increased minimum width
    gap: "16px", // Increased gap for better spacing
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
    flexShrink: 0, // Prevent input area from shrinking
    backgroundColor: "transparent", // Transparent background
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
  clearButtonLeft: {
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
    flexShrink: 0,
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
    0% { 
      transform: translateY(0); 
    }
    50% { 
      transform: translateY(-8px); 
    }
    100% { 
      transform: translateY(0); 
    }
  }

  .typing-dot {
    animation: typing 0.8s infinite ease-in-out;
  }

  .typing-dot:nth-child(1) {
    animation-delay: 0s;
  }

  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }



  .clearButton:hover {
    background-color: #2563EB;
  }

  .quickQuestionButton:hover {
    background-color: #F3F4F6;
  }

  @keyframes slideUpFromBottom {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-slide-up {
    animation: slideUpFromBottom 0.4s ease-out;
  }
`
document.head.appendChild(styleSheet)

export default ProjectAdvisor
