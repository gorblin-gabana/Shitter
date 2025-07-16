import React from 'react';
import { useCanvasStore } from '../stores/canvasStore';

interface HeaderProps {
  onNavigateToAvatarCreator?: () => void;
  onNavigateToFeed?: () => void;
}

export function Header({ onNavigateToAvatarCreator, onNavigateToFeed }: HeaderProps = {}) {
  const { pixels } = useCanvasStore();

  const handlePointsClick = () => {
    window.open('https://points.gorbchain.xyz', '_blank');
  };

  return (
    <header className="bg-black/90 backdrop-blur-md border-b border-gray-800 p-4 h-20 flex-shrink-0">
      <div className="flex items-center justify-between h-full max-w-7xl mx-auto px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onNavigateToFeed}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="Shitter" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Shitter</h1>
              <p className="text-xs text-gray-400">Express Freely</p>
            </div>
          </button>
        </div>

        {/* Stats and Network */}
        <div className="flex items-center gap-6">
          <button 
            onClick={handlePointsClick}
            className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Points:</span>
              <span className="text-green-400 font-mono font-medium">{pixels.size}</span>
            </div>
          </button>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Gorbchain</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}