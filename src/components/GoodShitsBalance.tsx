import React, { useState } from 'react';
import { Zap, Plus, Minus, Info, Download } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { inAppWalletService } from '../services/sessionWalletService';

export function GoodShitsBalance() {
  const { 
    mainWallet,
    loadWallet,
    isTransferring 
  } = useWalletStore();
  
  const [showLoadWallet, setShowLoadWallet] = useState(false);
  const [loadAmount, setLoadAmount] = useState('10');

  const inAppWallet = inAppWalletService.getInAppWallet();
  const isActive = inAppWalletService.isSessionActive();
  const formattedBalance = inAppWalletService.getFormattedBalance();
  const gorbBalance = inAppWalletService.getGorbBalance();
  const goodShitsBalance = inAppWalletService.getGoodShitsBalance();
  const actionCosts = inAppWalletService.getActionCosts();

  // Handle load wallet
  const handleLoadWallet = async () => {
    const amount = parseFloat(loadAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const success = await loadWallet(amount);
    if (success) {
      setShowLoadWallet(false);
      setLoadAmount('10');
    }
  };

  // Show message if no in-app wallet exists (shouldn't happen after onboarding)
  if (!isActive || !inAppWallet) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">In-App Wallet Not Available</h3>
          <p className="text-gray-400 text-sm">
            Please complete the onboarding process to create your in-app wallet.
          </p>
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

      {/* In-App Wallet Info */}
      <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">In-App Wallet</span>
          <span className="text-green-400">Active</span>
        </div>
        
        <div className="text-xs text-gray-500 font-mono">
          {inAppWallet?.address.slice(0, 8)}...{inAppWallet?.address.slice(-8)}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">Connected from:</div>
          <div className="text-xs text-gray-500 font-mono">
            {mainWallet?.slice(0, 4)}...{mainWallet?.slice(-4)}
          </div>
        </div>
      </div>

      {/* Load Wallet Section */}
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Load GORB</span>
          <button
            onClick={() => setShowLoadWallet(!showLoadWallet)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        {showLoadWallet && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount (GORB)</label>
              <input
                type="number"
                value={loadAmount}
                onChange={(e) => setLoadAmount(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLoadWallet(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadWallet}
                disabled={isTransferring || !loadAmount || parseFloat(loadAmount) <= 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {isTransferring ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load ${loadAmount || '0'} GORB`
                )}
              </button>
            </div>
          </div>
        )}
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