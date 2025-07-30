import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet, ExternalLink, Shield, Zap } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { Logo } from './ui/Logo';
import { SessionWalletModal } from './SessionWalletModal';
import { OnboardingFlow } from './OnboardingFlow';

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
    icon: '👻', // Use emoji instead of external URL
    description: 'Popular choice',
    url: 'https://phantom.app'
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '☀️', // Use emoji instead of external URL
    description: 'Feature-rich',
    url: 'https://solflare.com'
  },
  {
    id: 'backpack',
    name: 'Backpack',
    icon: '🎒', // Use emoji instead of external URL
    description: 'Modern wallet',
    url: 'https://backpack.app'
  }
];

// Session management constants
const SESSION_KEY = 'gorb-session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to get session from localStorage
function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session.signature || !session.publicKey || !session.timestamp) return null;
    // Check expiration
    if (Date.now() - session.timestamp > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Helper to set session
function setSession(session: { publicKey: string; signature: number[]; timestamp: number }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Helper to clear session
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

interface WalletConnectionProps {
  onComplete?: () => void;
}

export function WalletConnection({ onComplete }: WalletConnectionProps = {}) {
  const { connected, publicKey, connect, wallets, select, signMessage } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [trashpackError, setTrashpackError] = useState<string | null>(null);
  const [trashpackAddress, setTrashpackAddress] = useState<string | null>(null);
  const {
    gameWallet,
    generateGameWallet,
    setConnection,
    setMainWallet,
    setIsTrashpackConnected,
    showSessionWalletModal,
    setShowSessionWalletModal,
    createSessionWallet
  } = useWalletStore();
  const [session, setSessionState] = useState(() => getSession());
  const [isSigning, setIsSigning] = useState(false);
  const [isCreatingSessionWallet, setIsCreatingSessionWallet] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize connection
  useEffect(() => {
    const connection = new Connection('https://rpc.gorbchain.xyz', 'confirmed');
    setConnection(connection);
  }, [setConnection]);

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

  // After wallet connection, check if onboarding is needed
  useEffect(() => {
    if (connected && publicKey) {
      const onboardingCompleted = localStorage.getItem('shitter-onboarding-completed');
      const sessionWalletExists = localStorage.getItem('shitter-session-wallet-address');
      
      if (!onboardingCompleted || !sessionWalletExists) {
        // Show onboarding flow
        setShowOnboarding(true);
      } else {
        // User has completed onboarding, try to restore session
        const session = getSession();
        if (!session || session.publicKey !== publicKey.toString()) {
          // Need to sign in again
          (async () => {
            setIsSigning(true);
            try {
              if (!signMessage) {
                throw new Error('Wallet does not support message signing');
              }
              
              const message = `Sign to log in to Gorb Social.\nSession valid for 24 hours.\nWallet: ${publicKey.toString()}`;
              const encodedMessage = new TextEncoder().encode(message);
              const signature = await signMessage(encodedMessage);
              
              const sessionObj = {
                publicKey: publicKey.toString(),
                signature: Array.from(signature),
                timestamp: Date.now(),
              };
              setSession(sessionObj);
              setSessionState(sessionObj);
              
              // Try to recreate session wallet automatically
              try {
                const signatureUint8Array = new Uint8Array(sessionObj.signature);
                await createSessionWallet(signatureUint8Array, publicKey.toString());
                console.log('✅ Session wallet recreated automatically');
                onComplete?.();
              } catch (error) {
                console.log('Failed to recreate session wallet:', error);
                // Force re-onboarding if session wallet creation fails
                localStorage.removeItem('shitter-onboarding-completed');
                setShowOnboarding(true);
              }
            } catch (e) {
              console.error('Signature failed:', e);
              clearSession();
              setSessionState(null);
            } finally {
              setIsSigning(false);
            }
          })();
        } else {
          setSessionState(session);
          onComplete?.();
        }
      }
    } else {
      clearSession();
      setSessionState(null);
      setShowOnboarding(false);
    }
  }, [connected, publicKey, signMessage, createSessionWallet, onComplete]);


  // TrashPack login logic
  const loginWithTrashpack = async () => {
    // Prevent multiple simultaneous login attempts
    if (isConnecting) {
      console.log('🔄 Login already in progress, skipping...');
      return;
    }
    
    console.log('🚀 Starting TrashPack login...');
    setIsConnecting(true);
    setTrashpackError(null);
    setSelectedWallet(primaryWallet.id);
    
    try {
      console.log('🔍 Checking for TrashPack wallet...');
      
      if (typeof window === 'undefined') {
        console.log('❌ Window is undefined');
        setTrashpackError('Window is undefined.');
        return;
      }
      
      if (!(window as any).trashpack) {
        console.log('❌ TrashPack wallet not found on window object');
        setTrashpackError('TrashPack wallet not found. Please install the TrashPack extension.');
        window.open(primaryWallet.url, '_blank');
        return;
      }
      
      const trashpack = (window as any).trashpack;
      console.log('✅ TrashPack wallet found:', trashpack);
      
      console.log('🔗 Attempting to connect...');
      const result = await trashpack.connect();
      console.log('✅ Connection result:', result);
      
      let address = result?.publicKey;
      if (address && typeof address !== 'string') {
        address = address.toString();
      }
      console.log('📍 Address extracted:', address, 'Type:', typeof address);
      
      if (!address || typeof address !== 'string' || address.length < 32) {
        throw new Error('No valid address returned from wallet connection');
      }
      
      // Set the main wallet in the store - this will trigger the dashboard
      setMainWallet(address);
      setTrashpackAddress(address);
      setIsTrashpackConnected(true); // Ensure state is updated
      setSelectedWallet(null);
      
      // Dispatch a custom event to notify the app
      window.dispatchEvent(new Event('trashpack-connect'));
      
      console.log('✅ TrashPack login successful! Dashboard should now load...');
      console.log('📊 Final wallet state - mainWallet set to:', address);
      
    } catch (e: any) {
      console.error('❌ TrashPack login failed:', e);
      setTrashpackError(e?.message || 'Failed to connect to TrashPack wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletSelect = async (walletOption: WalletOption) => {
    if (walletOption.isOfficialWallet) {
      // Use TrashPack login logic
      await loginWithTrashpack();
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
        // Select the wallet first
        select(walletAdapter.adapter.name);
        
        // Wait a moment for the selection to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now try to connect
        await connect();
      } else {
        // If wallet not found, redirect to installation
        console.log(`Wallet ${walletOption.name} not found, redirecting to installation`);
        window.open(walletOption.url, '_blank');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      // Check if it's a WalletNotSelectedError and provide better handling
      if (error.name === 'WalletNotSelectedError') {
        console.error('No wallet was selected. Available wallets:', wallets.map(w => w.adapter.name));
      }
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    onComplete?.();
  };

  // Handle session wallet creation (legacy - now handled in onboarding)
  const handleCreateSessionWallet = async () => {
    if (!session || !publicKey) {
      throw new Error('No active session or wallet');
    }

    setIsCreatingSessionWallet(true);
    try {
      const signatureUint8Array = new Uint8Array(session.signature);
      await createSessionWallet(signatureUint8Array, publicKey.toString());
      console.log('✅ Session wallet created successfully');
      
      // Store wallet info in localStorage for fast access
      const walletInfo = {
        mainWallet: publicKey.toString(),
        sessionCreated: Date.now(),
        lastSession: session.timestamp
      };
      localStorage.setItem('shitter-wallet-info', JSON.stringify(walletInfo));
      
      // Close modal after successful creation
      setShowSessionWalletModal(false);
    } catch (error) {
      console.error('❌ Failed to create session wallet:', error);
      throw error;
    } finally {
      setIsCreatingSessionWallet(false);
    }
  };

  // Show onboarding flow if wallet is connected but onboarding not completed
  if (showOnboarding && connected && publicKey) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show loading spinner while signing
  if (isSigning) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-lg mx-auto text-center">
          <Logo size="large" showAnimation={true} />
          <div className="mt-8 text-lg">Please sign the login message in your wallet to continue...</div>
        </div>
      </div>
    );
  }

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
                {trashpackError && (
                  <div className="text-red-400 text-xs mt-2">{trashpackError}</div>
                )}
              </div>
              
              {/* Connect Button */}
              <div className="flex items-center gap-2 text-green-400 group-hover:text-green-300 transition-colors">
                {selectedWallet === primaryWallet.id && isConnecting ? (
                  <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-sm font-semibold">Connect</span>
                    <Wallet className="w-5 h-5" />
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600 mx-auto mb-2">
                    {wallet.isOfficialWallet && wallet.icon.startsWith('/') ? (
                      <img 
                        src={wallet.icon} 
                        alt={wallet.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{wallet.icon}</span>
                    )}
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

      {/* Session Wallet Modal */}
      <SessionWalletModal
        isOpen={showSessionWalletModal}
        onClose={() => setShowSessionWalletModal(false)}
        onCreateWallet={handleCreateSessionWallet}
        userAddress={publicKey?.toString() || ''}
        isCreating={isCreatingSessionWallet}
      />
    </div>
  );
}