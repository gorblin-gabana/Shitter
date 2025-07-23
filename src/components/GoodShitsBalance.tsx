import React from 'react';
import { Zap, Timer, Plus, Minus, Info } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { sessionWalletService, SessionWalletService } from '../services/sessionWalletService';

export function GoodShitsBalance() {
  const { 
    sessionWallet, 
    sessionWalletActive, 
    goodShitsBalance,
    setShowSessionWalletModal 
  } = useWalletStore();

  const timeRemaining = sessionWalletService.getTimeRemaining();
  const formattedBalance = sessionWalletService.getFormattedBalance();
  const gorbBalance = sessionWalletService.getGorbBalance();
  const actionCosts = sessionWalletService.getActionCosts();

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
          <div className="text-yellow-400 font-bold text-lg">{formattedBalance}</div>
          <div className="text-gray-500 text-xs">{goodShitsBalance} GoodShits</div>
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

      {/* Quick Actions with Fees */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs text-gray-400">Action Costs</div>
          <div className="group relative">
            <Info className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Includes 20% network fee
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-green-400 text-xs mb-1">
              <Plus className="w-3 h-3 inline mr-1" />
              Like
            </div>
            <div className="text-gray-500 text-xs">{actionCosts.like.total} GS</div>
            <div className="text-gray-600 text-xs">({actionCosts.like.base}+{actionCosts.like.fee} fee)</div>
          </div>
          
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-blue-400 text-xs mb-1">
              <Zap className="w-3 h-3 inline mr-1" />
              Share
            </div>
            <div className="text-gray-500 text-xs">{actionCosts.share.total} GS</div>
            <div className="text-gray-600 text-xs">({actionCosts.share.base}+{actionCosts.share.fee} fee)</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-purple-400 text-xs mb-1">
              <Plus className="w-3 h-3 inline mr-1" />
              Good Shit
            </div>
            <div className="text-gray-500 text-xs">{actionCosts.goodShit.total} GS</div>
            <div className="text-gray-600 text-xs">({actionCosts.goodShit.base}+{actionCosts.goodShit.fee} fee)</div>
          </div>
          
          <div className="bg-gray-900/30 rounded-lg p-2 text-center">
            <div className="text-red-400 text-xs mb-1">
              <Minus className="w-3 h-3 inline mr-1" />
              Bad Shit
            </div>
            <div className="text-gray-500 text-xs">{actionCosts.badShit.total} GS</div>
            <div className="text-gray-600 text-xs">({actionCosts.badShit.base}+{actionCosts.badShit.fee} fee)</div>
          </div>
        </div>
      </div>

      {/* Low Balance Warning */}
      {goodShitsBalance < actionCosts.share.total && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
          <div className="text-orange-400 text-xs font-medium mb-1">Low Balance</div>
          <div className="text-orange-300 text-xs">
            You need at least {actionCosts.like.total} GS for basic interactions. Earn more by receiving engagement!
          </div>
        </div>
      )}

      {/* Tokenomics Info */}
      <div className="bg-gray-900/30 rounded-lg p-2 space-y-1">
        <div className="text-xs text-gray-400 text-center font-medium">Gorbchain Economics</div>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>1 GORB =</span>
            <span>10,000 GS</span>
          </div>
          <div className="flex justify-between">
            <span>Network Fee:</span>
            <span>20%</span>
          </div>
          <div className="flex justify-between">
            <span>Your Balance:</span>
            <span>{gorbBalance.toFixed(6)} GORB</span>
          </div>
        </div>
      </div>
    </div>
  );
}