import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, TrendingUp, Users, Hash, Plus, Coins, Zap, LogOut, Download } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { Card, CardContent } from './ui/Card';

interface RightSidebarProps {
  connected: boolean;
  onNavigateToAvatarCreator?: () => void;
}

export function RightSidebar({ connected, onNavigateToAvatarCreator }: RightSidebarProps) {
  const { publicKey, wallet, disconnect } = useWallet();
  const { 
    gameWallet, 
    gameBalance, 
    isTrashpackConnected, 
    trashpackAddress, 
    loadWallet, 
    isTransferring 
  } = useWalletStore();
  
  const [showLoadWallet, setShowLoadWallet] = useState(false);
  const [loadAmount, setLoadAmount] = useState('10');

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

  // Get wallet info
  const getWalletInfo = () => {
    if (isTrashpackConnected) {
      return {
        name: 'TrashPack',
        icon: '/trashpack.png',
        address: trashpackAddress || '7xKXt...9Qm2',
        isImage: true
      };
    }

    if (connected && wallet) {
      const walletName = wallet.adapter.name;
      let icon = '👛';
      
      switch (walletName.toLowerCase()) {
        case 'backpack':
          icon = '🎒';
          break;
        case 'phantom':
          icon = '👻';
          break;
        case 'solflare':
          icon = '☀️';
          break;
        case 'slope':
          icon = '📐';
          break;
        case 'sollet':
          icon = '💙';
          break;
        default:
          icon = '👛';
      }

      return {
        name: walletName,
        icon,
        address: publicKey?.toString() || '',
        isImage: false
      };
    }

    return null;
  };

  const handleDisconnect = async () => {
    if (isTrashpackConnected) {
      // Disconnect TrashPack wallet
      const trashpack = (window as any).trashpack;
      if (trashpack?.disconnect) {
        await trashpack.disconnect();
      }
      window.location.reload(); // Refresh to update state
    } else {
      // Disconnect Solana wallet
      await disconnect();
    }
  };

  const handleLoadWallet = async () => {
    const amount = parseFloat(loadAmount);
    if (amount > 0) {
      const success = await loadWallet(amount);
      if (success) {
        setShowLoadWallet(false);
        setLoadAmount('10');
      }
    }
  };

  if (!connected) {
    return null;
  }

  const walletInfo = getWalletInfo();

  return (
    <div className="w-80 bg-gray-900/30 border-l border-gray-800/50 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Enhanced Wallet & Credits */}
          <Card className="bg-gray-800/20 border-gray-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    {walletInfo?.isImage ? (
                      <img src={walletInfo.icon} alt={walletInfo.name} className="w-5 h-5" />
                    ) : (
                      <span className="text-lg">{walletInfo?.icon}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">
                      {walletInfo?.name || 'Unknown'}
                    </div>
                    <div className="text-gray-400 text-xs font-mono">
                      {walletInfo?.address ? 
                        `${walletInfo.address.slice(0, 4)}...${walletInfo.address.slice(-3)}` : 
                        'Not connected'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <button
                    onClick={handleDisconnect}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Disconnect wallet"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Enhanced Credits Grid */}
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">GoodShits</div>
                  <div className="text-white text-base font-medium">1,247</div>
                </div>
                
                {gameWallet && (
                  <div className="bg-gray-800/40 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">GORB</div>
                    <div className="text-white text-base font-medium">{gameBalance.toFixed(1)}</div>
                  </div>
                )}
                
                <div className="bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Points</div>
                  <div className="text-white text-base font-medium">892</div>
                </div>
              </div>

              {/* Load Wallet Section */}
              {!showLoadWallet ? (
                <button
                  onClick={() => setShowLoadWallet(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Load Wallet
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Load GORB Amount</label>
                    <input
                      type="number"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                      placeholder="Enter amount"
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLoadWallet}
                      disabled={isTransferring || !loadAmount || parseFloat(loadAmount) <= 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      {isTransferring ? 'Loading...' : 'Transfer'}
                    </button>
                    <button
                      onClick={() => setShowLoadWallet(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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