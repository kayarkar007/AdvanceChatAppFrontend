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
  } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: () => userAPI.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // 30 seconds
  });

  // Get all users (not just online)
  const { data: allUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: userAPI.getAllUsers,
    staleTime: 30000, // 30 seconds
  });

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleStartConversation = async (selectedUser) => {
    try {
      // Create conversation with the selected user
      const response = await conversationAPI.createConversation([
        selectedUser._id,
      ]);

      if (response.data) {
        addConversation(response.data);
        onStartConversation?.(response.data);
        onClose();
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const displayUsers =
    searchQuery.length >= 2
      ? searchResults?.data || []
      : allUsers?.data || [];

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
                    .filter((u) => u._id !== user?._id) // Exclude current user
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
                              {userItem.firstName} {userItem.lastName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {userItem.email}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UserSearch 