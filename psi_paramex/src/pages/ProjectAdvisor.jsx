"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase/supabase"
import Layout from "../components/Layout"
import { BotMessageSquare, Menu, Save, Trash2, Plus, FolderOpen } from "lucide-react"

const ProjectAdvisor = () => {
  // Load messages from localStorage or use default
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem('projectAdvisorMessages')
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        
        // Check if we need to update the default message (remove old project alerts)
        if (messagesWithDates.length === 1 && messagesWithDates[0].id === 1 && messagesWithDates[0].type === "ai") {
          const content = messagesWithDates[0].content
          // If it contains old project access mentions, replace with new message
          if (content.includes("I have access to your") || content.includes("📊 Project Alert") || content.includes("overdue")) {
            console.log('🔄 Updating cached default message to remove project alerts')
            return [
              {
                id: 1,
                type: "ai",
                content: "Hello! I'm your AI Project Advisor powered by Meta Llama. I can help you with project management strategies, prioritization, time management, and workflow optimization. What would you like to discuss today?",
                timestamp: new Date(),
              },
            ]
          }
        }
        
        return messagesWithDates
      }
    } catch (error) {
      console.error('Error loading saved messages:', error)
    }
    
    // Default message if no saved messages or error
    return [
      {
        id: 1,
        type: "ai",
        content: "Hello! I'm your AI Project Advisor powered by Meta Llama. I can help you with project management strategies, prioritization, time management, and workflow optimization. What would you like to discuss today?",
        timestamp: new Date(),
      },
    ]
  })
  
  // History management states
  const [savedSessions, setSavedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('projectAdvisorSessions')
      if (saved) {
        const sessions = JSON.parse(saved)
        // Sort by createdAt timestamp, newest first - maintains consistent order
        return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
      return []
    } catch (error) {
      console.error('Error loading saved sessions:', error)
      return []
    }
  })
  
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      return localStorage.getItem('projectAdvisorCurrentSessionId') || null
    } catch (error) {
      console.error('Error loading current session ID:', error)
      return null
    }
  })
  const [showHistoryPanel, setShowHistoryPanel] = useState(true)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isDeletingSession, setIsDeletingSession] = useState(false)
  
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
  const sessionIdRef = useRef(null) // Use ref to avoid race conditions
  const autoSaveTimeoutRef = useRef(null) // Debounce auto-save
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

  // Initialize sessionIdRef from currentSessionId on mount
  useEffect(() => {
    if (currentSessionId && !sessionIdRef.current) {
      sessionIdRef.current = currentSessionId
      console.log('🔄 Restored session ID from localStorage:', currentSessionId)
    }
  }, [currentSessionId])



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
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('projectAdvisorMessages', JSON.stringify(messages))
      
      console.log('📝 Messages changed:', {
        messageCount: messages.length,
        isLoadingSession,
        sessionId: sessionIdRef.current,
        shouldAutoSave: messages.length > 1 && !isLoadingSession && !isDeletingSession
      })
      
      // Auto-save session when there are actual conversation messages (more than just the initial AI greeting)
      if (messages.length > 1 && !isLoadingSession && !isDeletingSession) {
        // Clear existing timeout to debounce auto-save
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        
        // Debounce auto-save by 500ms to prevent rapid duplicate saves
        autoSaveTimeoutRef.current = setTimeout(() => {
          console.log('🚀 Triggering debounced auto-save...')
          autoSaveCurrentSession()
        }, 500)
      }
    } catch (error) {
      console.error('Error saving messages to localStorage:', error)
    }
  }, [messages, isLoadingSession, isDeletingSession])

  // Auto-save function
  const autoSaveCurrentSession = () => {
    // Generate session name from first user message or use default
    let sessionName = "New Conversation"
    const firstUserMessage = messages.find(msg => msg.type === "user")
    
    if (firstUserMessage) {
      // Use first 30 characters of first user message as session name
      sessionName = firstUserMessage.content.substring(0, 30).trim()
      if (firstUserMessage.content.length > 30) {
        sessionName += "..."
      }
    }
    
    // Use ref to avoid race conditions - generate ID only once per conversation
    if (!sessionIdRef.current) {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substr(2, 9)
      sessionIdRef.current = `session_${timestamp}_${randomId}`
      setCurrentSessionId(sessionIdRef.current)
      localStorage.setItem('projectAdvisorCurrentSessionId', sessionIdRef.current)
      console.log('🆔 Generated new session ID:', sessionIdRef.current)
    }
    
    const sessionId = sessionIdRef.current
    const existingSession = savedSessions.find(s => s.id === sessionId)
    
    // Don't auto-save if session already exists with same message count (prevents duplicates on page refresh)
    if (existingSession && existingSession.messageCount === messages.length) {
      console.log('⏭️ Skipping auto-save: session already up-to-date', {
        sessionId,
        existingMessageCount: existingSession.messageCount,
        currentMessageCount: messages.length
      })
      return
    }
    
    console.log('💾 Auto-saving session:', {
      sessionId,
      sessionName,
      messagesCount: messages.length,
      isNewSession: !existingSession
    })
    
    const sessionData = {
      id: sessionId,
      name: existingSession ? existingSession.name : sessionName,
      messages: messages,
      createdAt: existingSession ? existingSession.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length
    }
    
    // Update existing session in-place or add new one
    const updatedSessions = savedSessions.map(s => 
      s.id === sessionId ? sessionData : s
    )
    
    // Add new session if it doesn't exist
    if (!existingSession) {
      updatedSessions.unshift(sessionData)
    }
    
    // Sort by createdAt timestamp to maintain consistent order
    const sortedSessions = updatedSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    // Keep only the last 50 sessions for more history
    const limitedSessions = sortedSessions.slice(0, 50)
    
    setSavedSessions(limitedSessions)
    // currentSessionId already set above when generating new ID
    localStorage.setItem('projectAdvisorSessions', JSON.stringify(limitedSessions))
    
    console.log('✅ Session saved successfully. Total sessions:', limitedSessions.length)
  }

  // Function to clear chat history
  const clearChatHistory = () => {
    const defaultMessage = {
      id: 1,
      type: "ai",
      content: "Hello! I'm your AI Project Advisor. I can help you with project management strategies, prioritization, time management, and workflow optimization. What would you like to discuss today?",
      timestamp: new Date(),
    }
    setMessages([defaultMessage])
    setCurrentSessionId(null)
    sessionIdRef.current = null // Reset ref as well
    localStorage.removeItem('projectAdvisorMessages')
    localStorage.removeItem('projectAdvisorCurrentSessionId') // Clear session ID too
  }

  // Session Management Functions
  const saveCurrentSession = (sessionName) => {
    if (!sessionName.trim()) return false
    
    const sessionId = currentSessionId || `session_${Date.now()}`
    const newSession = {
      id: sessionId,
      name: sessionName.trim(),
      messages: messages,
      createdAt: currentSessionId ? 
        savedSessions.find(s => s.id === sessionId)?.createdAt || new Date().toISOString() :
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length
    }
    
    const updatedSessions = savedSessions.filter(s => s.id !== sessionId)
    updatedSessions.unshift(newSession)
    
    // Keep only the last 20 sessions to prevent localStorage bloat
    const limitedSessions = updatedSessions.slice(0, 20)
    
    setSavedSessions(limitedSessions)
    setCurrentSessionId(sessionId)
    localStorage.setItem('projectAdvisorSessions', JSON.stringify(limitedSessions))
    return true
  }
  
  const loadSession = (sessionId) => {
    const session = savedSessions.find(s => s.id === sessionId)
    if (!session) return false
    
    // Set loading flag to prevent auto-save during session load
    setIsLoadingSession(true)
    
    // Convert timestamp strings back to Date objects
    const messagesWithDates = session.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
    
    setMessages(messagesWithDates)
    setCurrentSessionId(sessionId)
    sessionIdRef.current = sessionId // Set ref to loaded session ID
    localStorage.setItem('projectAdvisorMessages', JSON.stringify(session.messages))
    localStorage.setItem('projectAdvisorCurrentSessionId', sessionId) // Save session ID
    // Don't auto-close sidebar - let user control it manually
    
    // Clear loading flag after a short delay to ensure all state updates are complete
    setTimeout(() => {
      setIsLoadingSession(false)
    }, 100)
    
    return true
  }
  
  const deleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      setIsDeletingSession(true)
      
      const updatedSessions = savedSessions.filter(s => s.id !== sessionId)
      // Sort by createdAt to maintain consistent order
      const sortedSessions = updatedSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setSavedSessions(sortedSessions)
      localStorage.setItem('projectAdvisorSessions', JSON.stringify(sortedSessions))
      
      // If we're deleting the current session, clear it
      if (sessionIdRef.current === sessionId) {
        clearChatHistory()
      }
      
      // Reset the flag after a short delay to allow state updates to complete
      setTimeout(() => {
        setIsDeletingSession(false)
      }, 100)
    }
  }
  
  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to delete ALL conversation history? This action cannot be undone.')) {
      setIsDeletingSession(true)
      
      setSavedSessions([])
      localStorage.removeItem('projectAdvisorSessions')
      localStorage.removeItem('projectAdvisorMessages') // Also clear current messages
      localStorage.removeItem('projectAdvisorCurrentSessionId') // Clear session ID
      clearChatHistory()
      
      // Reset the flag after a short delay to allow state updates to complete
      setTimeout(() => {
        setIsDeletingSession(false)
      }, 100)
    }
  }
  

  
  const createNewSession = () => {
    setIsDeletingSession(true)
    
    clearChatHistory()
    setCurrentSessionId(null)
    sessionIdRef.current = null // Reset ref for new session
    setIsLoadingSession(false)
    
    // Reset the flag after a short delay to allow state updates to complete
    setTimeout(() => {
      setIsDeletingSession(false)
    }, 100)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Function to handle sidebar toggle with animation
  const toggleSidebarWithAnimation = () => {
    setShowHistoryPanel(!showHistoryPanel)
  }

  // Function to fetch user projects for AI context
  const fetchUserProjects = async (userId) => {
    try {
      console.log('🔍 Fetching projects for AI context...')
      const response = await fetch(`http://localhost:8000/api/user-projects/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserProjects(data.projects || [])
        console.log(`✅ Loaded ${data.projects?.length || 0} projects for AI context:`, data.projects)
        
        // Projects loaded for AI context but no default message update needed
      } else {
        console.error('❌ Failed to fetch projects:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Failed to fetch user projects:', error)
    }
  }



  // Typewriter effect function - very fast typing
  const typewriterEffect = (text, messageId, delay = 1) => {
    return new Promise((resolve) => {
      let currentIndex = 0
      setIsRevealing(true)
      setRevealingMessageId(messageId)
      
      const typeNextChunk = () => {
        if (currentIndex <= text.length) {
          // Type 3-5 characters at once for very fast effect
          const chunkSize = Math.min(5, text.length - currentIndex)
          currentIndex += chunkSize
          
          const partialText = text.substring(0, currentIndex)
          
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: partialText, isRevealing: currentIndex < text.length }
              : msg
          ))
          
          if (currentIndex < text.length) {
            typewriterTimeoutRef.current = setTimeout(typeNextChunk, delay)
          } else {
            setIsRevealing(false)
            setRevealingMessageId(null)
            resolve()
          }
        }
      }
      
      typeNextChunk()
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
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error.message || errorData.error
          }
        } catch {
          // If we can't parse the error response, use the status code
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error calling AI API:', error)
      
      // More specific error messages based on the error type
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return "I'm having trouble connecting to the AI server. Please make sure the backend server is running on localhost:8000 and try again."
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        return "The AI server is experiencing technical difficulties. This might be due to:\n\n• Groq API issues\n• Server configuration problems\n• Database connection issues\n\nPlease try again in a few moments. If the problem persists, check the backend server logs for more details."
      } else if (error.message.includes('404')) {
        return "The AI chat endpoint is not available. Please make sure the backend server is running with the correct API endpoints."
      } else {
        return `I apologize, but I'm experiencing technical difficulties. Error: ${error.message}\n\nPlease try again later or check if the backend server is running properly.`
      }
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
    "How do I get started with freelance project management?",
    "What tools should I use for project tracking?"
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
      <div className="max-w-full mx-auto" style={styles.container}>
        
        {/* ChatGPT-style Layout: Sidebar + Main Chat */}
        <div style={styles.chatGPTLayout}>
          
          {/* Left Sidebar - History */}
          <div 
            style={{
              ...styles.sidebar,
              transform: showHistoryPanel ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            <div style={styles.sidebarHeader}>
              <button
                onClick={createNewSession}
                style={styles.newChatButton}
                className="newChatButton"
                title="Start new conversation"
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
              
              {savedSessions.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  style={styles.clearAllButton}
                  className="clearAllButton"
                  title="Delete all conversations"
                >
                  <Trash2 size={16} />
                  <span>Clear All History</span>
                </button>
              )}
            </div>
            
            <div style={styles.sidebarContent} className="sidebarContent">
              {savedSessions.length === 0 ? (
                <div style={styles.emptySidebar}>
                  <p style={styles.emptySidebarText}>No conversations yet</p>
                </div>
              ) : (
                <div style={styles.conversationsList}>
                  {savedSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        ...styles.conversationItem,
                        ...(currentSessionId === session.id ? styles.activeConversationItem : {})
                      }}
                      onClick={() => loadSession(session.id)}
                      className="conversationItem"
                    >
                      <div style={styles.conversationInfo}>
                        <h3 style={styles.conversationName}>{session.name}</h3>
                        <div style={styles.conversationMeta}>
                          <span style={styles.conversationDate}>
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        style={styles.deleteConversationButton}
                        title="Delete conversation"
                        className="deleteConversationButton"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div style={{
            ...styles.mainChatArea,
            marginLeft: showHistoryPanel ? "clamp(240px, 25vw, 320px)" : "0",
          }}>
            {/* Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderContent}>
                <div style={styles.chatHeaderTop}>
                  <button
                    onClick={toggleSidebarWithAnimation}
                    style={{
                      ...styles.toggleSidebarButton,
                      transform: showHistoryPanel ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                    className="toggleSidebarButton"
                    title={showHistoryPanel ? "Hide history" : "Show history"}
                  >
                    <Menu size={20} />
                  </button>
                  <h1 style={styles.chatTitle}>
                    <BotMessageSquare size={24} color="#3B82F6" />
                    AI Project Advisor
                  </h1>
                </div>
                <p style={styles.chatSubtitle}>
                  Get intelligent advice for your freelance project management
                </p>
              </div>
            </div>

            {/* Chat Container */}
            <div style={styles.chatContainer}>
              {/* Messages */}
              <div style={styles.messagesContainer} className="messagesContainer">
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
                          <BotMessageSquare size={20} color="white" />
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

                {/* Simple Loading Indicator */}
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
                    className="sendButton"
                  >
                    <SendIcon />
                  </button>
                </div>
                <p style={styles.inputHint}>
                  {isTyping || isRevealing ? (
                    <>AI is responding... Conversations auto-saved</> 
                  ) : (
                    <>Press Enter to send • Conversations auto-saved</>
                  )}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  )
}

// Icon Components
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
    height: "calc(100vh - 120px)",
    minHeight: "500px",
    maxHeight: "none",
  },
  chatGPTLayout: {
    display: "flex",
    flexDirection: "row",
    height: "100%",
    borderRadius: "0.5rem",
    overflow: "hidden",
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "relative",
  },
  
  // Sidebar Styles
  sidebar: {
    width: "clamp(240px, 25vw, 320px)",
    backgroundColor: "#F8FAFC",
    borderRight: "1px solid #E2E8F0",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.03), -6px -6px 12px rgba(255, 255, 255, 0.8)",
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 10,
    transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
  sidebarHeader: {
    padding: "1rem",
    borderBottom: "1px solid #E2E8F0",
  },
  newChatButton: {
    width: "100%",
    padding: "0.75rem 1rem",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    marginBottom: "0.5rem",
  },

  clearAllButton: {
    width: "100%",
    padding: "0.5rem 1rem",
    backgroundColor: "#EF4444",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: "500",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
  },
  sidebarContent: {
    flex: 1,
    padding: "1rem",
    overflowY: "auto",
  },
  emptySidebar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748B",
  },
  emptySidebarText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748B",
    margin: 0,
  },
  conversationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  conversationItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid transparent",
    backgroundColor: "transparent",
  },
  activeConversationItem: {
    backgroundColor: "#EBF5FF",
    borderColor: "#3B82F6",
  },
  conversationInfo: {
    flex: 1,
    minWidth: 0,
  },
  conversationName: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#1E293B",
    margin: "0 0 0.25rem 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  conversationMeta: {
    display: "flex",
    alignItems: "center",
  },
  conversationDate: {
    fontSize: "0.75rem",
    color: "#64748B",
  },
  deleteConversationButton: {
    padding: "0.25rem",
    backgroundColor: "transparent",
    border: "1px solid transparent",
    borderRadius: "0.25rem",
    cursor: "pointer",
    color: "#64748B",
    transition: "all 0.2s",
    opacity: 1,
    marginLeft: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Main Chat Area Styles
  mainChatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
  chatHeader: {
    padding: "1rem 1.25rem",
    borderBottom: "1px solid #E2E8F0",
    backgroundColor: "white",
  },
  chatHeaderContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  chatHeaderTop: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    width: "100%",
  },
  toggleSidebarButton: {
    padding: "0.5rem",
    backgroundColor: "#F1F5F9",
    border: "1px solid #E2E8F0",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    color: "#64748B",
  },
  chatTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1E293B",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  chatSubtitle: {
    fontSize: "0.875rem",
    color: "#64748B",
    margin: 0,
  },

  
  // Chat Container
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    overflow: "hidden",
  },
  messagesContainer: {
    flex: 1,
    padding: "1rem 1.25rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minHeight: 0,
  },
  messageWrapper: {
    display: "flex",
    width: "100%",
  },
  messageGroup: {
    display: "flex",
    alignItems: "flex-end",
    gap: "0.75rem",
    maxWidth: "80%",
  },
  aiAvatar: {
    width: "2rem",
    height: "2rem",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatar: {
    width: "2rem",
    height: "2rem",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  messageBubble: {
    padding: "0.75rem 1rem",
    borderRadius: "1.125rem",
    maxWidth: "100%",
    wordWrap: "break-word",
  },
  aiMessage: {
    backgroundColor: "#F1F5F9",
    color: "#1E293B",
    borderBottomLeftRadius: "6px",
  },
  userMessage: {
    backgroundColor: "#3B82F6",
    color: "white",
    borderBottomRightRadius: "6px",
  },
  messageContent: {
    margin: "0 0 0.25rem 0",
    fontSize: "0.875rem",
    lineHeight: "1.5",
  },
  messageTime: {
    fontSize: "0.75rem",
    opacity: 0.7,
  },
  
  // Loading Indicator
  simpleLoadingContainer: {
    display: "flex",
    justifyContent: "flex-start",
    marginLeft: "2.75rem",
    padding: "0.75rem 0",
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    padding: "8px 12px",
    backgroundColor: "#F1F5F9",
    borderRadius: "12px",
  },
  typingDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#64748B",
    borderRadius: "50%",
  },
  
  // Quick Questions
  quickQuestionsContainer: {
    padding: "1rem 1.25rem",
    flexShrink: 0,
    backgroundColor: "transparent",
  },
  quickQuestionsTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1E293B",
    margin: "0 0 1rem 0",
  },
  quickQuestionsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(17.5rem, 1fr))",
    gap: "0.75rem",
  },
  quickQuestionButton: {
    padding: "0.75rem 1rem",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    color: "#334155",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  
  // Input Area
  inputContainer: {
    padding: "1rem 1.25rem",
    flexShrink: 0,
    backgroundColor: "white",
    borderTop: "1px solid #E2E8F0",
  },
  inputWrapper: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-end",
    maxWidth: "50rem",
    margin: "0 auto",
  },
  messageInput: {
    flex: 1,
    padding: "0.75rem 1rem",
    border: "1px solid #D1D5DB",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    minHeight: "2.75rem",
    maxHeight: "7.5rem",
  },
  sendButton: {
    padding: "0.75rem",
    backgroundColor: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
    cursor: "not-allowed",
  },
  inputHint: {
    fontSize: "0.75rem",
    color: "#64748B",
    margin: "0.5rem 0 0 0",
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

  /* ChatGPT-style hover effects */
  .newChatButton:hover {
    background-color: #2563EB;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  .conversationItem:hover {
    background-color: #F1F5F9;
    border-color: #CBD5E1;
  }

  .conversationItem:hover .deleteConversationButton {
    opacity: 1;
  }

  .conversationItem.active {
    background-color: #EBF5FF;
    border-color: #3B82F6;
  }

  .deleteConversationButton:hover {
    background-color: #DC2626 !important;
    color: white !important;
    borderColor: #DC2626 !important;
  }

  .quickQuestionButton:hover {
    background-color: #F1F5F9;
    border-color: #CBD5E1;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .sendButton:hover {
    background-color: #2563EB;
  }

  .toggleSidebarButton:hover {
    background-color: #E2E8F0;
    color: #1E293B;
    filter: brightness(1.1);
  }

  .messageInput:focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Scrollbar styling for sidebar */
  .sidebarContent::-webkit-scrollbar {
    width: 6px;
  }

  .sidebarContent::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebarContent::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
  }

  .sidebarContent::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }

  /* Scrollbar styling for messages */
  .messagesContainer::-webkit-scrollbar {
    width: 6px;
  }

  .messagesContainer::-webkit-scrollbar-track {
    background: transparent;
  }

  .messagesContainer::-webkit-scrollbar-thumb {
    background: #E2E8F0;
    border-radius: 3px;
  }

  .messagesContainer::-webkit-scrollbar-thumb:hover {
    background: #CBD5E1;
  }

  .clearButton:hover {
    background-color: #475569;
  }

  .clearChatButton:hover {
    background-color: #475569;
  }

  .clearAllButton:hover {
    background-color: #DC2626;
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  }
`
document.head.appendChild(styleSheet)

export default ProjectAdvisor
