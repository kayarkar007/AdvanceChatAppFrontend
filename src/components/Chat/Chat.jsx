import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ConversationList from "./ConversationList";
import MessageArea from "./MessageArea";
import UserSearch from "./UserSearch";
import { conversationAPI } from "../../services/api";
import useChatStore from "../../store/useChatStore";
import LoadingSpinner from "../UI/LoadingSpinner";

const Chat = () => {
  const {
    activeConversation,
    setActiveConversation,
    conversations,
    setConversations,
    currentConversation,
  } = useChatStore();
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  // Debug logging
  console.log("🔍 Chat Debug:", {
    activeConversation: activeConversation?._id,
    currentConversation: currentConversation?._id,
    conversationsCount: conversations?.length,
    isUserSearchOpen,
  });

  // Force re-render when active conversation changes
  useEffect(() => {
    console.log(
      "🔍 Chat component re-rendered, currentConversation:",
      currentConversation?._id
    );
  }, [currentConversation]);

  // Fetch conversations
  const { isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: conversationAPI.getConversations,
    onSuccess: (data) => {
      setConversations(data.data);
    },
    onError: (error) => {
      console.error("Failed to fetch conversations:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load conversations
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ConversationList
          onConversationSelect={setActiveConversation}
          onCreateNew={() => setIsUserSearchOpen(true)}
        />
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <MessageArea conversation={currentConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome to AdvanceChat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a conversation or start a new one to begin messaging
              </p>
              <button
                onClick={() => setIsUserSearchOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      <UserSearch
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onStartConversation={setActiveConversation}
      />
    </div>
  );
};

export default Chat;
