import React, { useState } from 'react';
import { User, Home, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface LeftSidebarProps {
  currentPage?: 'feed' | 'profile' | 'avatar-creator';
  onNavigateToProfile?: () => void;
  onNavigateToFeed?: () => void;
  selectedTribe?: string;
  onTribeChange?: (tribeId: string) => void;
}

export function LeftSidebar({ 
  currentPage = 'feed', 
  onNavigateToProfile, 
  onNavigateToFeed,
  selectedTribe = 'general',
  onTribeChange 
}: LeftSidebarProps) {
  const [expandedSuperTribes, setExpandedSuperTribes] = useState<string[]>(['community-hub']);

  const superTribes = [
    {
      id: 'community-hub',
      name: 'Community Hub',
      icon: '🏛️',
      tribes: [
        { id: 'general', name: 'General', icon: '💬', members: '1,247', online: '89' },
        { id: 'announcements', name: 'Announcements', icon: '📢', members: '892', online: '23' },
        { id: 'introductions', name: 'Introductions', icon: '👋', members: '567', online: '12' }
      ]
    },
    {
      id: 'creative-collective',
      name: 'Creative Collective',
      icon: '🎨',
      tribes: [
        { id: 'art', name: 'Art & NFTs', icon: '🎨', members: '892', online: '56' },
        { id: 'pixel-art', name: 'Pixel Art', icon: '🖼️', members: '445', online: '28' },
        { id: 'showcases', name: 'Showcases', icon: '🖼️', members: '334', online: '19' }
      ]
    },
    {
      id: 'financial-freedom',
      name: 'Financial Freedom',
      icon: '💰',
      tribes: [
        { id: 'defi', name: 'DeFi & Trading', icon: '💰', members: '734', online: '42' },
        { id: 'nfts', name: 'NFT Trading', icon: '💎', members: '445', online: '31' },
        { id: 'yield-farming', name: 'Yield Farming', icon: '🌾', members: '223', online: '15' }
      ]
    },
    {
      id: 'builder-zone',
      name: 'Builder Zone',
      icon: '⚡',
      tribes: [
        { id: 'tech', name: 'Tech & Dev', icon: '⚡', members: '567', online: '31' },
        { id: 'blockchain', name: 'Blockchain Dev', icon: '🔗', members: '234', online: '18' },
        { id: 'tools', name: 'Tools & Scripts', icon: '🛠️', members: '156', online: '9' }
      ]
    },
    {
      id: 'entertainment-hub',
      name: 'Entertainment Hub',
      icon: '🎉',
      tribes: [
        { id: 'memes', name: 'Memes & Fun', icon: '😂', members: '445', online: '28' },
        { id: 'gaming', name: 'Gaming', icon: '🎮', members: '334', online: '22' },
        { id: 'off-topic', name: 'Off Topic', icon: '💭', members: '223', online: '14' }
      ]
    }
  ];

  const toggleSuperTribe = (superTribeId: string) => {
    setExpandedSuperTribes(prev => 
      prev.includes(superTribeId) 
        ? prev.filter(id => id !== superTribeId)
        : [...prev, superTribeId]
    );
  };

  return (
    <div className="w-72 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Navigation Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Navigation</h2>
        </div>
        
        {/* Navigation Buttons - Only Feed, remove Profile */}
        <div className="space-y-2">
          <button 
            onClick={onNavigateToFeed}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentPage === 'feed'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Feed</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Messages</span>
          </button>
        </div>
      </div>

      {/* Tribes Tree Structure */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>🏘️</span>
            Tribes
          </h3>
          
          <div className="space-y-2">
            {superTribes.map((superTribe) => {
              const isExpanded = expandedSuperTribes.includes(superTribe.id);
              return (
                <div key={superTribe.id} className="space-y-1">
                  {/* Super Tribe Header */}
                  <button
                    onClick={() => toggleSuperTribe(superTribe.id)}
                    className="w-full flex items-center gap-2 p-2 text-gray-300 hover:bg-gray-800/30 rounded-lg transition-colors text-sm"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="text-base">{superTribe.icon}</span>
                    <span className="font-medium">{superTribe.name}</span>
                  </button>

                  {/* Tribes List */}
                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {superTribe.tribes.map((tribe) => (
                        <button
                          key={tribe.id}
                          onClick={() => onTribeChange?.(tribe.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-sm ${
                            selectedTribe === tribe.id
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'text-gray-400 hover:bg-gray-800/30 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{tribe.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="font-medium">#{tribe.name}</div>
                            <div className="text-xs text-gray-500">
                              {tribe.members} • {tribe.online} online
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* You Section - Restored */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-lg">🦍</div>
            <div>
              <div className="text-white font-medium text-sm">You</div>
              <div className="text-gray-400 text-xs">7xKXt...9Qm2</div>
            </div>
          </div>
          {onNavigateToProfile && (
            <button 
              onClick={onNavigateToProfile}
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Create Avatar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}