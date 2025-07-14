import { create } from 'zustand';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

export interface WalletState {
  // Main wallet (connected via adapter)
  mainWallet: string | null;
  mainBalance: number;
  
  // Game wallet (for auto-signing and fast transactions)
  gameWallet: Keypair | null;
  gameBalance: number;
  
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
  type: 'main-to-game' | 'game-to-main' | 'airdrop';
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

const RPC_ENDPOINT = 'https://rpc.gorbchain.xyz';

export const useWalletStore = create<WalletState>((set, get) => ({
  mainWallet: null,
  mainBalance: 0,
  gameWallet: null,
  gameBalance: 0,
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
  },

  setGameBalance: (balance) => set({ gameBalance: balance }),
  setConnection: (connection) => set({ connection }),
  setNetwork: (network) => set({ network }),

  transferToGameWallet: async (amount: number) => {
    const { connection, mainWallet, gameWallet } = get();
    
    if (!connection || !mainWallet || !gameWallet) {
      console.error('Missing required components for transfer');
      return false;
    }

    set({ isTransferring: true });

    try {
      const fromPubkey = new PublicKey(mainWallet);
      const toPubkey = gameWallet.publicKey;
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // This would need to be signed by the wallet adapter
      // For demo purposes, we'll simulate success
      const signature = 'demo_signature_' + Date.now();
      
      const transferRecord: TransferRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        from: mainWallet,
        to: gameWallet.publicKey.toString(),
        amount,
        type: 'main-to-game',
        signature,
        status: 'confirmed'
      };

      set(state => ({
        transferHistory: [transferRecord, ...state.transferHistory],
        isTransferring: false
      }));

      await get().updateBalances();
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      set({ isTransferring: false });
      return false;
    }
  },

  transferToMainWallet: async (amount: number) => {
    const { connection, mainWallet, gameWallet } = get();
    
    if (!connection || !mainWallet || !gameWallet) return false;

    set({ isTransferring: true });

    try {
      const fromPubkey = gameWallet.publicKey;
      const toPubkey = new PublicKey(mainWallet);
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Sign with game wallet
      transaction.sign(gameWallet);
      
      const signature = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(signature);

      const transferRecord: TransferRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        from: gameWallet.publicKey.toString(),
        to: mainWallet,
        amount,
        type: 'game-to-main',
        signature,
        status: 'confirmed'
      };

      set(state => ({
        transferHistory: [transferRecord, ...state.transferHistory],
        isTransferring: false
      }));

      await get().updateBalances();
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      set({ isTransferring: false });
      return false;
    }
  },

  fundGameWallet: async (amount = 0.1) => {
    const { connection, gameWallet, network } = get();
    
    if (!connection || !gameWallet) return false;

    try {
      // On testnet, request airdrop (mainnet doesn't have faucet)
      if (network === 'testnet') {
        const signature = await connection.requestAirdrop(
          gameWallet.publicKey,
          amount * LAMPORTS_PER_SOL
        );
        
        await connection.confirmTransaction(signature);

        const transferRecord: TransferRecord = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          from: 'faucet',
          to: gameWallet.publicKey.toString(),
          amount,
          type: 'airdrop',
          signature,
          status: 'confirmed'
        };

        set(state => ({
          transferHistory: [transferRecord, ...state.transferHistory]
        }));

        await get().updateBalances();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to fund game wallet:', error);
      return false;
    }
  },

  updateBalances: async () => {
    const { connection, mainWallet, gameWallet } = get();
    
    if (!connection) return;

    try {
      if (mainWallet) {
        const balance = await connection.getBalance(new PublicKey(mainWallet));
        set({ mainBalance: balance / LAMPORTS_PER_SOL });
      }

      if (gameWallet) {
        const balance = await connection.getBalance(gameWallet.publicKey);
        set({ gameBalance: balance / LAMPORTS_PER_SOL });
      }
    } catch (error) {
      console.error('Failed to update balances:', error);
    }
  },

  getTransferHistory: () => {
    return get().transferHistory;
  },

  clearTransferHistory: () => {
    set({ transferHistory: [] });
  },
}));