import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // Chat state
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,

  // Getters
  get activeConversation() {
    return get().currentConversation;
  },

  // UI state
  isTyping: false,
  typingUsers: [],
  isSidebarOpen: true,
  isEmojiPickerOpen: false,
  isFileUploadOpen: false,
  isVoiceRecording: false,
  isVideoCallActive: false,

  // Message state
  messageInput: "",
  replyTo: null,
  editMessage: null,

  // Search and filter
  searchQuery: "",
  messageFilter: "all", // all, media, files, links

  // Settings
  theme: "light",
  fontSize: "medium",
  soundEnabled: true,
  notificationsEnabled: true,

  // Actions
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) => {
    const { conversations } = get();
    set({ conversations: [conversation, ...conversations] });
  },

  updateConversation: (conversationId, updates) => {
    const { conversations } = get();
    set({
      conversations: conversations.map((conv) =>
        conv._id === conversationId ? { ...conv, ...updates } : conv
      ),
    });
  },

  setActiveConversation: (conversation) =>
    set({ currentConversation: conversation }),

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },

  updateMessage: (messageId, updates) => {
    const { messages } = get();
    set({
      messages: messages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      ),
    });
  },

  deleteMessage: (messageId) => {
    const { messages } = get();
    set({ messages: messages.filter((msg) => msg._id !== messageId) });
  },

  setTyping: (isTyping) => set({ isTyping }),

  addTypingUser: (userId) => {
    const { typingUsers } = get();
    if (!typingUsers.includes(userId)) {
      set({ typingUsers: [...typingUsers, userId] });
    }
  },

  removeTypingUser: (userId) => {
    const { typingUsers } = get();
    set({ typingUsers: typingUsers.filter((id) => id !== userId) });
  },

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  setEmojiPickerOpen: (isOpen) => set({ isEmojiPickerOpen: isOpen }),

  setFileUploadOpen: (isOpen) => set({ isFileUploadOpen: isOpen }),

  setVoiceRecording: (isRecording) => set({ isVoiceRecording: isRecording }),

  setVideoCallActive: (isActive) => set({ isVideoCallActive: isActive }),

  setMessageInput: (input) => set({ messageInput: input }),

  setReplyTo: (message) => set({ replyTo: message }),

  setEditMessage: (message) => set({ editMessage: message }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setMessageFilter: (filter) => set({ messageFilter: filter }),

  setTheme: (theme) => set({ theme }),

  setFontSize: (size) => set({ fontSize: size }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

  incrementUnreadCount: () => {
    const { unreadCount } = get();
    set({ unreadCount: unreadCount + 1 });
  },

  resetUnreadCount: () => set({ unreadCount: 0 }),

  clearChat: () => {
    set({
      messages: [],
      currentConversation: null,
      replyTo: null,
      editMessage: null,
      messageInput: "",
    });
  },
}));

export default useChatStore 