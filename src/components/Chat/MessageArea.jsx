import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Smile, Mic } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import { messageAPI } from "../../services/api";
import socketService from "../../services/socket";

const MessageArea = ({ conversation }) => {
  const { addMessage, isTyping } = useChatStore();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch messages for this conversation
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", conversation?._id],
    queryFn: () => messageAPI.getMessages(conversation._id),
    enabled: !!conversation?._id,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const messages = messagesData?.data || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) =>
      messageAPI.sendMessage(conversation._id, messageData),
    onSuccess: (response) => {
      console.log("🔍 Message sent successfully:", response.data);
      // Invalidate and refetch messages
      queryClient.invalidateQueries(["messages", conversation._id]);
      // Invalidate conversations to update last message
      queryClient.invalidateQueries(["conversations"]);
    },
    onError: (error) => {
      console.error("❌ Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket integration for real-time messaging
  useEffect(() => {
    if (!conversation?._id) return;

    // Join conversation room
    socketService.socket?.emit("conversation:join", {
      conversationId: conversation._id,
    });

    // Listen for new messages
    const handleNewMessage = (message) => {
      console.log("🔍 New message received:", message);
      if (message.conversation === conversation._id) {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries(["messages", conversation._id]);
        // Invalidate conversations to update last message
        queryClient.invalidateQueries(["conversations"]);
      }
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      console.log("🔍 Typing indicator:", data);
      // Handle typing indicators here
    };

    socketService.socket?.on("message:new", handleNewMessage);
    socketService.socket?.on("typing:start", handleTyping);
    socketService.socket?.on("typing:stop", handleTyping);

    return () => {
      socketService.socket?.off("message:new", handleNewMessage);
      socketService.socket?.off("typing:start", handleTyping);
      socketService.socket?.off("typing:stop", handleTyping);
      socketService.socket?.emit("conversation:leave", {
        conversationId: conversation._id,
      });
    };
  }, [conversation?._id, queryClient]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversation) return;

    const messageData = {
      content: newMessage.trim(),
      type: "text",
    };

    // Send message via API
    sendMessageMutation.mutate(messageData);

    // Clear input immediately for better UX
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log("File selected:", file.name);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording logic here
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (message) => {
    return message.sender?._id === user?._id;
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Send size={24} />
          </div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.name?.charAt(0).toUpperCase() || "C"}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {conversation.name || "Conversation"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.participants?.length || 0} participants
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isTyping && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Typing...
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Send size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                isOwnMessage(message) ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage(message)
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <p className="text-sm">{message.content?.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage(message)
                      ? "text-primary-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>

          <button
            onClick={handleVoiceRecord}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Mic size={20} />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isLoading}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sendMessageMutation.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />
      </div>
    </div>
  );
};

export default MessageArea 