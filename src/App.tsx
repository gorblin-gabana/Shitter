import React, { useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
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

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

type PageType = 'feed' | 'profile' | 'avatar-creator';

function AppContent() {
  const { connected } = useWallet();
  const { setMainWallet, setConnection, mainWallet, setIsTrashpackConnected, isTrashpackConnected, setTrashpackAddress } = useWalletStore();
  const [showTour, setShowTour] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('feed');
  const [selectedTribe, setSelectedTribe] = useState('general');

  // Check if TrashPack is connected and get real address
  const trashpackWallet = (window as any).trashpack;
  const trashpackConnected = Boolean(trashpackWallet?.connected);
  const trashpackAddress = trashpackWallet?.publicKey?.toString() || null;
  const isAnyWalletConnected = connected || isTrashpackConnected;

  // Update TrashPack connection state in store
  useEffect(() => {
    setIsTrashpackConnected(trashpackConnected);
    if (trashpackConnected && trashpackAddress) {
      setTrashpackAddress(trashpackAddress);
      setMainWallet(trashpackAddress);
    }
  }, [trashpackConnected, trashpackAddress, setIsTrashpackConnected, setTrashpackAddress, setMainWallet]);

  console.log('🔄 AppContent render - connected:', connected, 'trashpackConnected:', isTrashpackConnected, 'trashpackAddress:', trashpackAddress, 'anyConnected:', isAnyWalletConnected, 'showTour:', showTour, 'currentPage:', currentPage);

  useEffect(() => {
    // Initialize wallet store connection
    const connection = new Connection('https://rpc.gorbchain.xyz');
    setConnection(connection);
  }, [setConnection]);

  // Check if user has completed tour
  useEffect(() => {
    console.log('🎯 Tour check - anyWalletConnected:', isAnyWalletConnected);
    if (isAnyWalletConnected) {
      const tourCompleted = localStorage.getItem('tour-completed');
      console.log('📚 Tour completed from storage:', tourCompleted);
      if (!tourCompleted) {
        console.log('🚀 Starting tour...');
        setShowTour(true);
      } else {
        console.log('✅ Tour already completed, skipping');
        setShowTour(false);
      }
    }
  }, [isAnyWalletConnected]);

  const handleTourComplete = () => {
    console.log('🎉 Tour completed!');
    localStorage.setItem('tour-completed', 'true');
    setShowTour(false);
  };

  const handleTourSkip = () => {
    console.log('⏭️ Tour skipped!');
    localStorage.setItem('tour-completed', 'true');
    setShowTour(false);
  };

  const handleNavigateToProfile = () => {
    setCurrentPage('profile');
  };

  const handleNavigateToFeed = () => {
    setCurrentPage('feed');
  };

  const handleNavigateToAvatarCreator = () => {
    setCurrentPage('avatar-creator');
  };

  const handleTribeChange = (tribeId: string) => {
    setSelectedTribe(tribeId);
  };

  // Show login page when no wallet is connected
  if (!isAnyWalletConnected) {
    console.log('🔐 Showing login page');
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        <WalletConnection />
      </div>
    );
  }

  // Show avatar creator page
  if (currentPage === 'avatar-creator') {
    console.log('🎨 Showing avatar creator page');
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden">
        <AvatarCreator onBack={handleNavigateToFeed} />
      </div>
    );
  }

  // Show profile page
  if (currentPage === 'profile') {
    console.log('👤 Showing profile page');
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden">
        {/* Header */}
        <Header onNavigateToAvatarCreator={handleNavigateToAvatarCreator} onNavigateToFeed={handleNavigateToFeed} />
        
        {/* Full-Page Profile Content - No Left Sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProfilePage onNavigateToFeed={handleNavigateToFeed} />
        </div>
      </div>
    );
  }

  // Show dashboard (Twitter-like layout)
  console.log('🎯 Showing dashboard');
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <Header onNavigateToAvatarCreator={handleNavigateToAvatarCreator} onNavigateToFeed={handleNavigateToFeed} />
      
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4">
        {/* Left Sidebar - Navigation with Tribes */}
        <LeftSidebar 
          currentPage={currentPage}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToFeed={handleNavigateToFeed}
          selectedTribe={selectedTribe}
          onTribeChange={handleTribeChange}
        />
        
        {/* Main Feed Area */}
        <TwitterFeed 
          onNavigateToProfile={handleNavigateToProfile}
          selectedTribe={selectedTribe}
        />
        
        {/* Right Sidebar - Social Features */}
        <RightSidebar 
          connected={isAnyWalletConnected} 
          onNavigateToAvatarCreator={handleNavigateToAvatarCreator}
        />
      </div>

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
  // Use Gorbchain mainnet
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = 'https://rpc.gorbchain.xyz';

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;