import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, MessageCircle, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { userAPI, conversationAPI } from '../../services/api'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import LoadingSpinner from '../UI/LoadingSpinner'

const UserSearch = ({ isOpen, onClose, onStartConversation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const { addConversation } = useChatStore();

  // Search users query
  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
    error: searchError,
  } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: () => userAPI.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // 30 seconds
    retry: 1,
    onError: (error) => {
      console.error("Failed to search users:", error);
    },
  });

  // Get all users (not just online)
  const { data: allUsers, error: allUsersError } = useQuery({
    queryKey: ["allUsers"],
    queryFn: userAPI.getAllUsers,
    staleTime: 30000, // 30 seconds
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch all users:", error);
    },
  });

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

    const handleStartConversation = async (selectedUser) => {
      try {
        console.log("🔍 Starting conversation with:", selectedUser);

        // Create conversation with the selected user
        const response = await conversationAPI.createConversation({
          participants: [selectedUser._id],
          type: "direct",
        });

        console.log("🔍 Conversation response:", response.data);

        // Handle both new conversation creation and existing conversation
        // The response structure is: { message: "...", data: conversationObject }
        const conversationData = response.data?.data || response.data;

        if (conversationData && conversationData._id) {
          // Add conversation to store (if not already there)
          addConversation(conversationData);

          // Set as active conversation
          onStartConversation?.(conversationData);

          // Close the modal
          onClose();

          console.log("🔍 Conversation set as active:", conversationData._id);
        } else {
          console.error(
            "No valid conversation data received:",
            conversationData
          );
          alert("Failed to start conversation. Please try again.");
        }
      } catch (error) {
        console.error("Failed to start conversation:", error);
        // Show error to user
        alert("Failed to start conversation. Please try again.");
      }
    };

  // Ensure displayUsers is always an array with better error handling
  const displayUsers = (() => {
    try {
      let users = [];

      if (searchQuery.length >= 2) {
        // Handle API response structure - searchResults is the full response
        users = searchResults?.data?.data || searchResults?.data || [];
      } else {
        // Handle API response structure - allUsers is the full response
        users = allUsers?.data?.data || allUsers?.data || [];
      }

      // Ensure it's an array
      if (!Array.isArray(users)) {
        console.warn("Users data is not an array:", users);
        return [];
      }

      return users;
    } catch (error) {
      console.error("Error processing displayUsers:", error);
      return [];
    }
  })();

  // Debug logging
  console.log("🔍 UserSearch Debug:", {
    searchQuery,
    searchResults: searchResults?.data,
    allUsers: allUsers?.data,
    displayUsers,
    isArray: Array.isArray(displayUsers),
    displayUsersType: typeof displayUsers,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Start New Conversation
              </h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {isSearching ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : allUsersError ? (
                <div className="flex flex-col items-center justify-center p-8 text-red-500 dark:text-red-400">
                  <User size={48} className="mb-4 opacity-50" />
                  <p className="text-center">
                    Failed to load users. Please try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Retry
                  </button>
                </div>
              ) : displayUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                  <User size={48} className="mb-4 opacity-50" />
                  <p className="text-center">
                    {searchQuery.length >= 2
                      ? "No users found"
                      : "No users available"}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {displayUsers
                    .filter((u) => u && u._id && u._id !== user?._id) // Exclude current user and null items
                    .map((userItem) => (
                      <motion.div
                        key={userItem._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleStartConversation(userItem)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {userItem.firstName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userItem.fullName ||
                                `${userItem.firstName} ${userItem.lastName}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{userItem.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              userItem.isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          <MessageCircle size={16} className="text-gray-400" />
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchQuery.length >= 2
                  ? `Found ${displayUsers.length} users`
                  : `${displayUsers.length} total users`}
              </p>
              {displayUsers.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                  No users found. Try registering another account to test the
                  chat.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UserSearch 