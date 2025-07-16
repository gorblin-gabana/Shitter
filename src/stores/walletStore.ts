import { create } from 'zustand';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

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
  connection: null,
  network: 'mainnet',
  rpcEndpoint: RPC_ENDPOINT,
  isTransferring: false,
  transferHistory: [],

  setMainWallet: (address) => {
    set({ mainWallet: address });
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
      'devnet': 'https://api.devnet.solana.com',
      'testnet': 'https://api.testnet.solana.com', 
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
  
  clearTransferHistory: () => set({ transferHistory: [] })
}));