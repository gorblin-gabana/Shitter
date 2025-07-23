import React from 'react';
import { Zap, Timer, Plus, Minus } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { sessionWalletService } from '../services/sessionWalletService';

export function GoodShitsBalance() {
  const { 
    sessionWallet, 
    sessionWalletActive, 
    goodShitsBalance,
    setShowSessionWalletModal 
  } = useWalletStore();

  const timeRemaining = sessionWalletService.getTimeRemaining();

  if (!sessionWalletActive) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Session Wallet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Create a session wallet for lightning-fast social transactions
          </p>
          <button
            onClick={() => setShowSessionWalletModal(true)}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Create Session Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">GoodShits</h3>
            <p className="text-gray-400 text-xs">Social Currency</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-bold text-lg">{goodShitsBalance}</div>
          <div className="text-gray-500 text-xs">tokens</div>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Session Wallet</span>
          <span className="text-green-400">Active</span>
        </div>
        
        <div className="text-xs text-gray-500 font-mono">
          {sessionWallet?.slice(0, 8)}...{sessionWallet?.slice(-8)}
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Timer className="w-3 h-3 text-orange-400" />
          <span className="text-orange-400">
            {timeRemaining > 60 ? `${Math.floor(timeRemaining / 60)}h ${timeRemaining % 60}m` : `${timeRemaining}m`} remaining
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-2">Quick Actions</div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-green-400 text-xs mb-1">
              <Plus className="w-3 h-3 inline mr-1" />
              Like
            </div>
            <div className="text-gray-500 text-xs">1 GS</div>
          </div>
          
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-blue-400 text-xs mb-1">
              <Zap className="w-3 h-3 inline mr-1" />
              Share
            </div>
            <div className="text-gray-500 text-xs">2 GS</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-purple-400 text-xs mb-1">
              <Plus className="w-3 h-3 inline mr-1" />
              Comment
            </div>
            <div className="text-gray-500 text-xs">3 GS</div>
          </div>
          
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-red-400 text-xs mb-1">
              <Minus className="w-3 h-3 inline mr-1" />
              Dislike
            </div>
            <div className="text-gray-500 text-xs">1 GS</div>
          </div>
        </div>
      </div>

      {/* Low Balance Warning */}
      {goodShitsBalance < 10 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
          <div className="text-orange-400 text-xs font-medium mb-1">Low Balance</div>
          <div className="text-orange-300 text-xs">
            You're running low on GoodShits. Earn more by receiving likes and engagement!
          </div>
        </div>
      )}

      {/* Auto-refill Info */}
      <div className="text-xs text-gray-500 text-center">
        Balance auto-refills when you receive engagement
      </div>
    </div>
  );
}