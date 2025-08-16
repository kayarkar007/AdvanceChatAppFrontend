import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, MoreVertical } from 'lucide-react'
import { useQuery } from "@tanstack/react-query";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import { conversationAPI } from "../../services/api";

const ConversationList = ({ onConversationSelect, onCreateNew }) => {
  const { setActiveConversation, currentConversation: activeConversation } =
    useChatStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: conversationAPI.getConversations,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const conversations = conversationsData?.data || [];

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participants?.some(
        (p) =>
          p.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    onConversationSelect?.(conversation);
  };

  const getConversationName = (conversation) => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }
    const otherParticipant = conversation.participants?.find(
      (p) => p.user?._id !== user?._id
    );
    if (otherParticipant?.user) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
    return "Unknown User";
  };

  const getLastMessage = (conversation) => {
    if (!conversation.lastMessage) return "No messages yet";
    // Handle nested content structure
    const content = conversation.lastMessage.content;
    if (typeof content === "string") {
      return content;
    }
    if (content?.text) {
      return content.text;
    }
    return "Media message";
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount || 0;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Conversations
          </h2>
          <button
            onClick={onCreateNew}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-sm">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Search size={24} />
              </div>
              <p className="text-sm">
                {searchTerm ? "No conversations found" : "No conversations yet"}
              </p>
              {!searchTerm && (
                <button
                  onClick={onCreateNew}
                  className="mt-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
                >
                  Start a conversation
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConversationClick(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeConversation?._id === conversation._id
                    ? "bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getConversationName(conversation)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    {conversation.participants?.some((p) => p.isOnline) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getUnreadCount(conversation) > 0 && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary-500 text-white rounded-full">
                            {getUnreadCount(conversation)}
                          </span>
                        )}
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {getLastMessage(conversation)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList 