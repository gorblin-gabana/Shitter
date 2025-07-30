import { create } from 'zustand';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { inAppWalletService } from '../services/sessionWalletService';

export interface WalletState {
  // Main wallet (connected via adapter)
  mainWallet: string | null;
  mainBalance: number;
  
  // Game wallet (for auto-signing and fast transactions)
  gameWallet: Keypair | null;
  gameBalance: number;
  
  // TrashPack wallet connection state
  isTrashpackConnected: boolean;
  trashpackAddress: string | null;
  
  // Session wallet state
  sessionWallet: string | null;
  sessionWalletActive: boolean;
  goodShitsBalance: number;
  showSessionWalletModal: boolean;
  
  // Connection
  connection: Connection | null;
  network: 'devnet' | 'testnet' | 'mainnet';
  rpcEndpoint: string;
  
  // Transfer state
  isTransferring: boolean;
  transferHistory: TransferRecord[];
  
  // Actions
  setMainWallet: (address: string | null) => void;
  setMainBalance: (balance: number) => void;
  generateGameWallet: () => void;
  setGameBalance: (balance: number) => void;
  setIsTrashpackConnected: (connected: boolean) => void;
  setTrashpackAddress: (address: string | null) => void;
  loadWallet: (amount: number) => Promise<boolean>;
  setConnection: (connection: Connection) => void;
  setNetwork: (network: 'devnet' | 'testnet' | 'mainnet') => void;
  transferToGameWallet: (amount: number) => Promise<boolean>;
  transferToMainWallet: (amount: number) => Promise<boolean>;
  fundGameWallet: (amount?: number) => Promise<boolean>;
  updateBalances: () => Promise<void>;
  getTransferHistory: () => TransferRecord[];
  clearTransferHistory: () => void;
  restoreWalletState: () => void;
  disconnectWallet: () => void;
  
  // Session wallet actions
  setSessionWallet: (address: string | null) => void;
  setSessionWalletActive: (active: boolean) => void;
  setGoodShitsBalance: (balance: number) => void;
  setShowSessionWalletModal: (show: boolean) => void;
  createInAppWallet: (userAddress: string, pin: string) => Promise<void>;
  spendGoodShits: (amount: number, action: string) => boolean;
  addGoodShits: (amount: number, source: string) => void;
  checkSessionWalletStatus: () => void;
}

export interface TransferRecord {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  type: 'main-to-game' | 'game-to-main' | 'airdrop' | 'load-wallet';
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

const RPC_ENDPOINT = 'https://rpc.gorbchain.xyz';

export const useWalletStore = create<WalletState>((set, get) => ({
  mainWallet: null,
  mainBalance: 0,
  gameWallet: null,
  gameBalance: 0,
  isTrashpackConnected: false,
  trashpackAddress: null,
  sessionWallet: null,
  sessionWalletActive: false,
  goodShitsBalance: 0,
  showSessionWalletModal: false,
  connection: null,
  network: 'mainnet',
  rpcEndpoint: RPC_ENDPOINT,
  isTransferring: false,
  transferHistory: [],

  setMainWallet: (address) => {
    console.log('🏦 setMainWallet called with:', address);
    console.log('🏦 Previous mainWallet was:', get().mainWallet);
    console.log('🔍 Called from:', new Error().stack?.split('\n')[2]?.trim());
    set({ mainWallet: address });
    console.log('🏦 New mainWallet is:', get().mainWallet);
    
    // Persist main wallet state to localStorage
    if (address) {
      localStorage.setItem('main-wallet', address);
      localStorage.setItem('wallet-connected', 'true');
    } else {
      localStorage.removeItem('main-wallet');
      localStorage.removeItem('wallet-connected');
    }
    
    if (address && !get().gameWallet) {
      get().generateGameWallet();
    }
  },
  
  setMainBalance: (balance) => set({ mainBalance: balance }),
  
  setIsTrashpackConnected: (connected) => set({ isTrashpackConnected: connected }),
  
  setTrashpackAddress: (address) => set({ trashpackAddress: address }),
  
  loadWallet: async (amount) => {
    const { connection, gameWallet } = get();
    
    set({ isTransferring: true });
    
    try {
      // Simulate GORB token transfer to in-app wallet
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBalance = get().gameBalance + amount;
      set({ gameBalance: newBalance });
      
      // Add to transfer history
      const record: TransferRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        from: 'Main Wallet',
        to: gameWallet?.publicKey.toString() || 'Game Wallet',
        amount,
        type: 'load-wallet',
        status: 'confirmed'
      };
      
      set({ 
        transferHistory: [record, ...get().transferHistory],
        isTransferring: false 
      });
      
      return true;
    } catch (error) {
      console.error('Load wallet failed:', error);
      set({ isTransferring: false });
      return false;
    }
  },
  
  generateGameWallet: () => {
    const gameWallet = Keypair.generate();
    set({ gameWallet });
    
    // Store in localStorage for session persistence
    localStorage.setItem('game-wallet', JSON.stringify(Array.from(gameWallet.secretKey)));
    
    // Try to restore from localStorage on initialization
    const stored = localStorage.getItem('game-wallet');
    if (stored) {
      try {
        const secretKey = new Uint8Array(JSON.parse(stored));
        const restoredWallet = Keypair.fromSecretKey(secretKey);
        set({ gameWallet: restoredWallet });
      } catch (error) {
        console.error('Failed to restore game wallet:', error);
      }
    }
    
    // Initialize with some balance for testing
    set({ gameBalance: 100.0 });
  },
  
  setGameBalance: (balance) => set({ gameBalance: balance }),
  
  setConnection: (connection) => set({ connection }),
  
  setNetwork: (network) => {
    const endpoints = {
      'devnet': 'https://rpc.gorbchain.xyz',
      'testnet': 'https://rpc.gorbchain.xyz', 
      'mainnet': 'https://rpc.gorbchain.xyz'
    };
    
    set({ 
      network,
      rpcEndpoint: endpoints[network]
    });
  },

  transferToGameWallet: async (amount) => {
    const { connection, gameWallet, mainWallet } = get();
    
    if (!connection || !gameWallet || !mainWallet) {
      return false;
    }

    set({ isTransferring: true });
    
    try {
      // Simulate transfer
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newMainBalance = Math.max(0, get().mainBalance - amount);
      const newGameBalance = get().gameBalance + amount;
      
      set({ 
        mainBalance: newMainBalance,
        gameBalance: newGameBalance
      });
      
      const record: TransferRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        from: mainWallet,
        to: gameWallet.publicKey.toString(),
        amount,
        type: 'main-to-game',
        status: 'confirmed'
      };
      
      set({ 
        transferHistory: [record, ...get().transferHistory],
        isTransferring: false 
      });
      
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      set({ isTransferring: false });
      return false;
    }
  },

  transferToMainWallet: async (amount) => {
    const { connection, gameWallet, mainWallet } = get();
    
    if (!connection || !gameWallet || !mainWallet || get().gameBalance < amount) {
      return false;
    }

    set({ isTransferring: true });
    
    try {
      // Simulate transfer
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newMainBalance = get().mainBalance + amount;
      const newGameBalance = get().gameBalance - amount;
      
      set({ 
        mainBalance: newMainBalance,
        gameBalance: newGameBalance
      });
      
      const record: TransferRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        from: gameWallet.publicKey.toString(),
        to: mainWallet,
        amount,
        type: 'game-to-main',
        status: 'confirmed'
      };
      
      set({ 
        transferHistory: [record, ...get().transferHistory],
        isTransferring: false 
      });
      
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      set({ isTransferring: false });
      return false;
    }
  },

  fundGameWallet: async (amount = 50) => {
    set({ isTransferring: true });
    
    try {
      // Simulate airdrop
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBalance = get().gameBalance + amount;
      set({ gameBalance: newBalance });
      
      const record: TransferRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        from: 'Airdrop',
        to: get().gameWallet?.publicKey.toString() || 'Game Wallet',
        amount,
        type: 'airdrop',
        status: 'confirmed'
      };
      
      set({ 
        transferHistory: [record, ...get().transferHistory],
        isTransferring: false 
      });
      
      return true;
    } catch (error) {
      console.error('Funding failed:', error);
      set({ isTransferring: false });
      return false;
    }
  },

  updateBalances: async () => {
    // Simulate balance updates
    try {
      const mockMainBalance = Math.random() * 1000;
      const currentGameBalance = get().gameBalance;
      
      set({ 
        mainBalance: mockMainBalance,
        gameBalance: currentGameBalance // Keep game balance as is
      });
    } catch (error) {
      console.error('Failed to update balances:', error);
    }
  },

  getTransferHistory: () => get().transferHistory,
  
  clearTransferHistory: () => set({ transferHistory: [] }),

  restoreWalletState: () => {
    try {
      const mainWallet = localStorage.getItem('main-wallet');
      const isConnected = localStorage.getItem('wallet-connected') === 'true';
      
      if (isConnected && mainWallet) {
        console.log('🔄 Restoring wallet state:', mainWallet);
        set({ 
          mainWallet: mainWallet,
          isTrashpackConnected: true,
          trashpackAddress: mainWallet 
        });
      }
    } catch (error) {
      console.error('Failed to restore wallet state:', error);
    }
  },

  disconnectWallet: () => {
    console.log('👋 Disconnecting wallet and clearing state');
    set({ 
      mainWallet: null,
      isTrashpackConnected: false,
      trashpackAddress: null,
      sessionWallet: null,
      sessionWalletActive: false,
      goodShitsBalance: 0
    });
    localStorage.removeItem('main-wallet');
    localStorage.removeItem('wallet-connected');
    inAppWalletService.clearSession();
  },

  // Session wallet methods
  setSessionWallet: (address) => set({ sessionWallet: address }),
  
  setSessionWalletActive: (active) => set({ sessionWalletActive: active }),
  
  setGoodShitsBalance: (balance) => set({ goodShitsBalance: balance }),
  
  setShowSessionWalletModal: (show) => set({ showSessionWalletModal: show }),

  createInAppWallet: async (userAddress, pin) => {
    try {
      console.log('🚀 Creating in-app wallet...');
      const wallet = await inAppWalletService.createInAppWallet(userAddress, pin);
      
      set({
        sessionWallet: wallet.address,
        sessionWalletActive: true,
        goodShitsBalance: inAppWalletService.getGoodShitsBalance()
      });
      
      console.log('✅ In-app wallet created and stored');
    } catch (error) {
      console.error('❌ Failed to create in-app wallet:', error);
      throw error;
    }
  },

  spendGoodShits: (amount, action) => {
    try {
      const result = inAppWalletService.spendGoodShits(amount, action);
      if (result.success) {
        set({ goodShitsBalance: inAppWalletService.getGoodShitsBalance() });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to spend GoodShits:', error);
      return false;
    }
  },

  addGoodShits: (amount, source) => {
    try {
      inAppWalletService.addGoodShits(amount, source);
      set({ goodShitsBalance: inAppWalletService.getGoodShitsBalance() });
    } catch (error) {
      console.error('Failed to add GoodShits:', error);
    }
  },

  checkSessionWalletStatus: () => {
    const isActive = inAppWalletService.isSessionActive();
    const wallet = inAppWalletService.getInAppWallet();
    const balance = inAppWalletService.getGoodShitsBalance();
    
    set({
      sessionWallet: wallet?.address || null,
      sessionWalletActive: isActive,
      goodShitsBalance: balance
    });
    
    if (!isActive && get().sessionWallet) {
      console.log('⏰ In-app wallet session expired, cleared from store');
    }
  }
}));