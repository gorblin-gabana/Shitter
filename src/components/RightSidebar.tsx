import React from 'react';
import { TrendingUp, Users, Hash, Plus } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { GoodShitsBalance } from './GoodShitsBalance';

interface RightSidebarProps {
  connected: boolean;
  onNavigateToAvatarCreator?: () => void;
}

export function RightSidebar({ connected, onNavigateToAvatarCreator }: RightSidebarProps) {

  const trendingTopics = [
    { tag: '#GorbChain', posts: '2.4k' },
    { tag: '#PixelArt', posts: '1.8k' },
    { tag: '#Decentralized', posts: '1.2k' },
    { tag: '#NFTs', posts: '945' },
    { tag: '#DeFi', posts: '673' },
    { tag: '#YieldFarming', posts: '432' },
    { tag: '#Memes', posts: '389' },
    { tag: '#Gaming', posts: '267' }
  ];

  const suggestedUsers = [
    { username: 'crypto_artist', address: '9mNx...4Kl8', avatar: '🎨', followers: '2.1k' },
    { username: 'defi_degen', address: '3pQr...7Ng9', avatar: '💰', followers: '1.8k' },
    { username: 'pixel_master', address: '5kLm...2Bv4', avatar: '🖼️', followers: '1.5k' },
    { username: 'blockchain_dev', address: '8nRx...3Ky7', avatar: '⚡', followers: '1.3k' }
  ];

  const communitiesToJoin = [
    { name: 'Blockchain Devs', members: '234', category: 'Tech', icon: '🔗' },
    { name: 'Yield Farmers', members: '223', category: 'DeFi', icon: '🌾' },
    { name: 'Gaming Guild', members: '334', category: 'Gaming', icon: '🎮' }
  ];

  // Removed unused wallet connection code - handled in Header component

  if (!connected) {
    return null;
  }

  return (
    <div className="w-80 bg-gray-900/30 border-l border-gray-800/50 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* GoodShits Balance / Session Wallet */}
          <GoodShitsBalance />

          {/* Trending - Enhanced */}
          <Card className="bg-gray-800/20 border-gray-700/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">Trending</span>
              </div>
              <div className="space-y-2">
                {trendingTopics.slice(0, 6).map((topic) => (
                  <div key={topic.tag} className="flex items-center justify-between py-2 hover:bg-gray-700/20 rounded px-2 cursor-pointer transition-colors">
                    <span className="text-gray-300 text-sm">{topic.tag}</span>
                    <span className="text-gray-500 text-xs">{topic.posts}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Who to Follow - Enhanced */}
          <Card className="bg-gray-800/20 border-gray-700/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">Suggested</span>
              </div>
              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <div key={user.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{user.username}</div>
                        <div className="text-gray-500 text-xs">{user.followers}</div>
                      </div>
                    </div>
                    <button className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded transition-colors">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Communities - Enhanced */}
          <Card className="bg-gray-800/20 border-gray-700/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">Communities</span>
              </div>
              <div className="space-y-3">
                {communitiesToJoin.map((community) => (
                  <div key={community.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm">
                        {community.icon}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{community.name}</div>
                        <div className="text-gray-500 text-xs">{community.members} members</div>
                      </div>
                    </div>
                    <button className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded transition-colors">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}