import React, { useState } from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';
import { Logo } from './ui/Logo';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onLogoClick?: () => void;
}

export function Header({ onSearch, onOpenNotifications, onOpenSettings, onOpenProfile, onLogoClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Live search - trigger search on every keystroke
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogoClick}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Logo />
          </button>
          <div className="hidden md:block">
            <p className="text-sm text-gray-400">Express Freely</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search posts, users, hashtags..."
                className="w-full bg-gray-800/50 hover:bg-gray-800/70 focus:bg-gray-800 text-white placeholder-gray-400 pl-12 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 border border-gray-700/50 focus:border-blue-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (onSearch) onSearch('');
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Action Buttons and Wallet */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200 relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={onOpenProfile}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </button>
          
          {/* Wallet info/disconnect button will be added here later */}
        </div>
      </div>
    </header>
  );
}