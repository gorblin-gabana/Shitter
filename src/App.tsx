import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { TrashpackWalletAdapter } from 'trashpack-wallet-adapter';
import { useWallet } from '@solana/wallet-adapter-react';
import { Toaster } from 'sonner';
import { MessageCircle } from 'lucide-react';

import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { WalletConnection } from './components/WalletConnection';
import { TwitterFeed } from './components/TwitterFeed';
import { ProfilePage } from './components/ProfilePage';
import { AvatarCreator } from './components/AvatarCreator';
import { GuidedTour } from './components/GuidedTour';
import { useWalletStore } from './stores/walletStore';
import { ChatPanel } from './components/ChatPanel';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

type PageType = 'feed' | 'profile' | 'avatar-creator';

function AppContent() {
  
  const { setMainWallet, setConnection, mainWallet, restoreWalletState, checkSessionWalletStatus } = useWalletStore();
  const { connected, publicKey } = useWallet();
  const [showTour, setShowTour] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('feed');
  const [selectedTribe, setSelectedTribe] = useState('general');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  
  // SIMPLIFIED: Use mainWallet as primary source of truth
  const isAnyWalletConnected = !!mainWallet;

  // Restore wallet state on app startup
  React.useEffect(() => {
    restoreWalletState();
    
    // Check if onboarding was completed
    const completed = localStorage.getItem('shitter-onboarding-completed');
    setOnboardingCompleted(!!completed);
  }, [restoreWalletState]);

  // Check session wallet status periodically
  React.useEffect(() => {
    // Check immediately
    checkSessionWalletStatus();
    
    // Check every 30 seconds for session expiration
    const interval = setInterval(() => {
      checkSessionWalletStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkSessionWalletStatus]);


  React.useEffect(() => {
    if (connected && publicKey && !mainWallet) {
      setMainWallet(publicKey.toString());
    }
  }, [connected, publicKey, mainWallet, setMainWallet]);

  // Simple handler functions
  const handleNavigateToProfile = () => setCurrentPage('profile');
  const handleNavigateToFeed = () => setCurrentPage('feed');
  const handleNavigateToAvatarCreator = () => setCurrentPage('avatar-creator');
  const handleTribeChange = (tribeId: string) => setSelectedTribe(tribeId);
  const handleTourComplete = () => {
    localStorage.setItem('tour-completed', 'true');
    setShowTour(false);
  };
  const handleTourSkip = () => {
    localStorage.setItem('tour-completed', 'true');
    setShowTour(false);
  };

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
  };

  // Show login/onboarding page when no wallet is connected or onboarding not completed
  if (!isAnyWalletConnected || (isAnyWalletConnected && !onboardingCompleted)) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden fixed inset-0 z-10">
        <WalletConnection onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Show avatar creator page
  if (currentPage === 'avatar-creator') {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden fixed inset-0 z-20">
        <AvatarCreator onBack={handleNavigateToFeed} />
      </div>
    );
  }

  // Show profile page
  if (currentPage === 'profile') {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden fixed inset-0 z-20">
        {/* Header */}
        <Header 
          onSearch={setGlobalSearchQuery}
          onOpenNotifications={() => {/* TODO: Open notifications modal */}}
          onOpenSettings={() => {/* TODO: Open settings modal */}}
          onOpenProfile={() => setCurrentPage('profile')}
          onLogoClick={handleNavigateToFeed}
        />
        
        {/* Full-Page Profile Content - No Left Sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProfilePage onNavigateToFeed={handleNavigateToFeed} />
        </div>
      </div>
    );
  }

  // Show dashboard (Twitter-like layout)
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden fixed inset-0 z-20">
      {/* Header */}
      <Header 
        onSearch={setGlobalSearchQuery}
        onOpenNotifications={() => {/* TODO: Open notifications modal */}}
        onOpenSettings={() => {/* TODO: Open settings modal */}}
        onOpenProfile={() => setCurrentPage('profile')}
        onLogoClick={handleNavigateToFeed}
      />
      
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-6">
        {/* Left Sidebar - Navigation with Tribes */}
        <LeftSidebar 
          currentPage={currentPage}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToFeed={handleNavigateToFeed}
          selectedTribe={selectedTribe}
          onTribeChange={handleTribeChange}
        />
        
        {/* Main Feed Area */}
        <div className="flex-1 min-w-0">
          <TwitterFeed 
            onNavigateToProfile={handleNavigateToProfile} 
            selectedTribe={selectedTribe}
            globalSearchQuery={globalSearchQuery}
          />
        </div>
        
        {/* Right Sidebar - Social Features */}
        <RightSidebar 
          connected={isAnyWalletConnected} 
          onNavigateToAvatarCreator={handleNavigateToAvatarCreator}
        />
      </div>

      {/* Floating Message Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg z-30 transition-all duration-200 hover:scale-110"
        title="Send Encrypted Message"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {showChat && (
        <ChatPanel onClose={() => setShowChat(false)} />
      )}

      {/* Floating Messages Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50">
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Guided Tour System */}
      <GuidedTour 
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
        }}
      />
    </div>
  );
}

function App() {
  const endpoint = 'https://rpc.gorbchain.xyz';

  // Memoize wallets to prevent context changes
  const wallets = React.useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new LedgerWalletAdapter(),
    new TrashpackWalletAdapter()
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;