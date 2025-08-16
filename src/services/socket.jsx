import { io } from 'socket.io-client'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'
import toast from 'react-hot-toast'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://advancechatappbackend.onrender.com";

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    const token = useAuthStore.getState().token
    
    if (!token) {
      console.warn('No auth token available for socket connection')
      return
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      toast.success('Connected to chat server')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to chat server')
      }
    })

    // Chat events
    this.socket.on('message:new', (message) => {
      const { addMessage, incrementUnreadCount, currentConversation } = useChatStore.getState()
      
      // Only add message if it's from the current conversation
      if (currentConversation && message.conversationId === currentConversation._id) {
        addMessage(message)
      } else {
        incrementUnreadCount()
      }
      
      // Play notification sound if enabled
      if (useChatStore.getState().soundEnabled) {
        this.playNotificationSound()
      }
    })

    this.socket.on('message:updated', (message) => {
      const { updateMessage } = useChatStore.getState()
      updateMessage(message._id, message)
    })

    this.socket.on('message:deleted', (messageId) => {
      const { deleteMessage } = useChatStore.getState()
      deleteMessage(messageId)
    })

    this.socket.on('message:reaction', ({ messageId, reaction, userId }) => {
      const { updateMessage } = useChatStore.getState()
      const { messages } = useChatStore.getState()
      
      const message = messages.find(m => m._id === messageId)
      if (message) {
        const reactions = message.reactions || {}
        if (!reactions[reaction]) {
          reactions[reaction] = []
        }
        if (!reactions[reaction].includes(userId)) {
          reactions[reaction].push(userId)
        }
        updateMessage(messageId, { reactions })
      }
    })

    this.socket.on('message:reaction_removed', ({ messageId, reaction, userId }) => {
      const { updateMessage } = useChatStore.getState()
      const { messages } = useChatStore.getState()
      
      const message = messages.find(m => m._id === messageId)
      if (message && message.reactions && message.reactions[reaction]) {
        message.reactions[reaction] = message.reactions[reaction].filter(id => id !== userId)
        updateMessage(messageId, { reactions: message.reactions })
      }
    })

    // Typing events
    this.socket.on('typing:start', (data) => {
      const { addTypingUser } = useChatStore.getState()
      addTypingUser(data.userId)
    })

    this.socket.on('typing:stop', (data) => {
      const { removeTypingUser } = useChatStore.getState()
      removeTypingUser(data.userId)
    })

    // Conversation events
    this.socket.on('conversation:new', (conversation) => {
      const { addConversation } = useChatStore.getState()
      addConversation(conversation)
    })

    this.socket.on('conversation:updated', (conversation) => {
      const { updateConversation } = useChatStore.getState()
      updateConversation(conversation._id, conversation)
    })

    this.socket.on('conversation:deleted', (conversationId) => {
      const { conversations, setConversations, currentConversation, setCurrentConversation } = useChatStore.getState()
      const updatedConversations = conversations.filter(conv => conv._id !== conversationId)
      setConversations(updatedConversations)
      
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(null)
      }
    })

    // User events
    this.socket.on('user:online', (userId) => {
      const { conversations, updateConversation } = useChatStore.getState()
      conversations.forEach(conv => {
        if (conv.participants.some(p => p._id === userId)) {
          updateConversation(conv._id, { 
            participants: conv.participants.map(p => 
              p._id === userId ? { ...p, isOnline: true } : p
            )
          })
        }
      })
    })

    this.socket.on('user:offline', (userId) => {
      const { conversations, updateConversation } = useChatStore.getState()
      conversations.forEach(conv => {
        if (conv.participants.some(p => p._id === userId)) {
          updateConversation(conv._id, { 
            participants: conv.participants.map(p => 
              p._id === userId ? { ...p, isOnline: false } : p
            )
          })
        }
      })
    })

    // Call events
    this.socket.on('call:incoming', (callData) => {
      toast((t) => (
        <div className="flex items-center space-x-2">
          <span>Incoming call from {callData.caller.name}</span>
          <button
            onClick={() => this.acceptCall(callData.callId)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Accept
          </button>
          <button
            onClick={() => this.rejectCall(callData.callId)}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Reject
          </button>
        </div>
      ), { duration: 30000 })
    })

    this.socket.on('call:accepted', (callData) => {
      useChatStore.getState().setVideoCallActive(true)
      toast.success('Call accepted')
    })

    this.socket.on('call:rejected', () => {
      toast.error('Call rejected')
    })

    this.socket.on('call:ended', () => {
      useChatStore.getState().setVideoCallActive(false)
      toast.success('Call ended')
    })

    // Notification events
    this.socket.on('notification:new', (notification) => {
      if (useChatStore.getState().notificationsEnabled) {
        toast(notification.message, {
          icon: notification.type === 'message' ? '💬' : '🔔',
        })
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Emit events
  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('conversation:join', { conversationId })
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('conversation:leave', { conversationId })
    }
  }

  sendMessage(conversationId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:send', { conversationId, message })
    }
  }

  startTyping(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', { conversationId })
    }
  }

  stopTyping(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', { conversationId })
    }
  }

  reactToMessage(messageId, reaction) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:react', { messageId, reaction })
    }
  }

  removeReaction(messageId, reaction) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:remove_reaction', { messageId, reaction })
    }
  }

  initiateCall(conversationId, type = 'video') {
    if (this.socket && this.isConnected) {
      this.socket.emit('call:initiate', { conversationId, type })
    }
  }

  acceptCall(callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call:accept', { callId })
    }
  }

  rejectCall(callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call:reject', { callId })
    }
  }

  endCall(callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call:end', { callId })
    }
  }

  // Utility methods
  playNotificationSound() {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(err => console.log('Could not play notification sound:', err))
  }

  isConnected() {
    return this.isConnected
  }

  getSocketId() {
    return this.socket?.id
  }
}

export default new SocketService() 