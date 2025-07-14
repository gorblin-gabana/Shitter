import React, { useEffect } from 'react';
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

import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { PixelCanvas } from './components/PixelCanvas';
import { RightSidebar } from './components/RightSidebar';
import { WalletConnection } from './components/WalletConnection';
import { useWalletStore } from './stores/walletStore';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

function AppContent() {
  const { connected } = useWallet();
  const { setMainWallet, setConnection } = useWalletStore();

  useEffect(() => {
    // Initialize wallet store connection
    const connection = new Connection('https://rpc.gorbchain.xyz');
    setConnection(connection);
  }, [setConnection]);

  // Show login page when not connected
  if (!connected) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        <WalletConnection />
      </div>
    );
  }

  // Show profile creator when connected
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Layers */}
        <LeftSidebar />
        
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PixelCanvas />
        </div>
        
        {/* Right Sidebar - Controls */}
        <RightSidebar connected={connected} />
      </div>

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