import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet, ExternalLink, Shield, Zap } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { Logo } from './ui/Logo';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string;
  isOfficialWallet?: boolean;
}

const primaryWallet: WalletOption = {
  id: 'trashpack',
  name: 'TrashPack',
  icon: '/trashpack.png',
  description: 'Official Shitter wallet with built-in privacy features',
  url: 'https://trashpack.tech',
  isOfficialWallet: true
};

const secondaryWallets: WalletOption[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: 'https://pbs.twimg.com/profile_images/1673646499095785472/RvZ-jFgF_400x400.png',
    description: 'Popular choice',
    url: 'https://phantom.app'
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: 'https://pbs.twimg.com/profile_images/1586270527327576066/uJ8Cqh60_400x400.jpg',
    description: 'Feature-rich',
    url: 'https://solflare.com'
  },
  {
    id: 'backpack',
    name: 'Backpack',
    icon: 'https://pbs.twimg.com/profile_images/1610743223433465856/YX7sWJwS_400x400.jpg',
    description: 'Modern wallet',
    url: 'https://backpack.app'
  }
];

export function WalletConnection() {
  const { connected, publicKey, connect, wallets, select } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const {
    gameWallet,
    generateGameWallet,
    setConnection,
    setMainWallet
  } = useWalletStore();

  // Initialize connection
  useEffect(() => {
    const connection = new Connection('https://rpc.gorbchain.xyz', 'confirmed');
    setConnection(connection);
  }, [setConnection]);

  // Update main wallet when connected
  useEffect(() => {
    if (connected && publicKey) {
      setMainWallet(publicKey.toString());
    } else {
      setMainWallet(null);
    }
  }, [connected, publicKey, setMainWallet]);

  // Generate game wallet on first visit
  useEffect(() => {
    if (!gameWallet) {
      const saved = localStorage.getItem('game-wallet');
      if (saved) {
        try {
          const secretKey = new Uint8Array(JSON.parse(saved));
          const restored = Keypair.fromSecretKey(secretKey);
          useWalletStore.setState({ gameWallet: restored });
        } catch (error) {
          console.error('Failed to restore game wallet:', error);
          generateGameWallet();
        }
      } else {
        generateGameWallet();
      }
    }
  }, [gameWallet, generateGameWallet]);



  const handleWalletSelect = async (walletOption: WalletOption) => {
    if (walletOption.isOfficialWallet) {
      // Handle TrashPack wallet - redirect to app or show installation instructions
      window.open(walletOption.url, '_blank');
      return;
    }

    setSelectedWallet(walletOption.id);
    setIsConnecting(true);

    try {
      // Find the wallet adapter
      const walletAdapter = wallets.find(w => 
        w.adapter.name.toLowerCase().includes(walletOption.id) ||
        walletOption.id.includes(w.adapter.name.toLowerCase())
      );

      if (walletAdapter) {
        select(walletAdapter.adapter.name);
        await connect();
      } else {
        // If wallet not found, redirect to installation
        window.open(walletOption.url, '_blank');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-lg mx-auto">
        {/* Brand Section */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 mb-8">
          {/* Logo with Scanner Animation */}
          <div className="flex justify-center mb-6">
            <Logo size="large" showAnimation={true} />
          </div>
          
          {/* Tagline */}
          <div className="flex items-center justify-center gap-2 text-gray-300 text-lg font-medium mb-6">
            <span className="text-green-400">Uncensored</span>
            <span className="text-gray-500">•</span>
            <span className="text-emerald-400">Encrypted</span>
            <span className="text-gray-500">•</span>
            <span className="text-cyan-400">Onchain</span>
          </div>
          
          {/* Mission Statement */}
          <div className="text-center">
            <p className="text-gray-400 leading-relaxed text-base">
              Join the revolution. Express yourself without limits on the only social platform that truly protects your freedom.
            </p>
          </div>
        </div>

        {/* Primary Wallet - TrashPack */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 text-center">Connect with Official Wallet</h2>
          
          <button
            onClick={() => handleWalletSelect(primaryWallet)}
            disabled={isConnecting}
            className="group relative w-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border-2 border-green-400/50 hover:border-green-400 rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] ring-2 ring-green-400/20"
          >
            <div className="flex items-center gap-4">
              {/* Wallet Icon */}
              <div className="w-16 h-16 rounded-xl bg-gray-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src={primaryWallet.icon} 
                  alt={primaryWallet.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTIiIGZpbGw9IiMxMGI5ODEiLz4KPHBhdGggZD0iTTI0IDEyQzE4IDEyIDEyIDE4IDEyIDI0QzEyIDMwIDE4IDM2IDI0IDM2QzMwIDM2IDM2IDMwIDM2IDI0QzM2IDE4IDMwIDEyIDI0IDEyWiIgZmlsbD0iIzA2NDcyYSIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
              
              {/* Wallet Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-lg">{primaryWallet.name}</h3>
                  <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs font-medium rounded-full">
                    Official
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{primaryWallet.description}</p>
              </div>
              
              {/* Connect Button */}
              <div className="flex items-center gap-2 text-green-400 group-hover:text-green-300 transition-colors">
                {selectedWallet === primaryWallet.id && isConnecting ? (
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-sm font-semibold">Get Wallet</span>
                    <ExternalLink className="w-5 h-5" />
                  </>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Secondary Wallets */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3 text-center">Or use existing wallet</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {secondaryWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet)}
                disabled={isConnecting}
                className={`group bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 hover:border-gray-600 rounded-lg p-3 transition-all duration-300 transform hover:scale-105 ${
                  selectedWallet === wallet.id ? 'scale-95 opacity-75' : ''
                }`}
              >
                <div className="text-center">
                  {/* Wallet Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center overflow-hidden mx-auto mb-2">
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name}
                      className="w-8 h-8 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzM3NEE1QyIvPgo8cGF0aCBkPSJNMTYgOEMxMiA4IDggMTIgOCAxNkM4IDIwIDEyIDI0IDE2IDI0QzIwIDI0IDI0IDIwIDI0IDE2QzI0IDEyIDIwIDggMTYgOFoiIGZpbGw9IiM2Qjc4OEUiLz4KPC9zdmc+';
                      }}
                    />
                  </div>
                  
                  <h4 className="text-white font-medium text-xs mb-1">{wallet.name}</h4>
                  <p className="text-gray-500 text-xs">{wallet.description}</p>
                  
                  {selectedWallet === wallet.id && isConnecting && (
                    <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-xl mb-1">🔒</div>
            <h3 className="text-xs font-semibold text-green-400 mb-1">Encrypted</h3>
            <p className="text-xs text-gray-500">Private by design</p>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-xl mb-1">🚫</div>
            <h3 className="text-xs font-semibold text-red-400 mb-1">Uncensored</h3>
            <p className="text-xs text-gray-500">No limits</p>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-xl mb-1">⚡</div>
            <h3 className="text-xs font-semibold text-yellow-400 mb-1">Lightning Fast</h3>
            <p className="text-xs text-gray-500">Instant posts</p>
          </div>
        </div>
        
        {/* Network Info */}
        <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="text-green-400 w-5 h-5" />
            <span className="text-green-400 font-medium text-sm">Powered by Gorbchain</span>
          </div>
          <p className="text-gray-500 text-xs">
            Decentralized infrastructure for true freedom of speech
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Connect your wallet to join the uncensored community
          </p>
        </div>
      </div>
    </div>
  );
}