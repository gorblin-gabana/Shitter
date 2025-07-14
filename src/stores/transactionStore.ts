import { create } from 'zustand';

export interface TransactionRecord {
  id: string;
  type: 'pixel' | 'batch' | 'bundle' | 'mint' | 'airdrop';
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details: string;
  pixelData?: { x: number; y: number; color: string };
  confirmationTime?: number;
}

export interface TransactionSettings {
  pixelsPerTransaction: number;
  batchSize: number;
  bundleSize: number;
  autoSend: boolean;
  maxTPS: number;
}

export interface TransactionState {
  transactions: TransactionRecord[];
  settings: TransactionSettings;
  isProcessing: boolean;
  totalSent: number;
  totalConfirmed: number;
  totalFailed: number;
  
  // Actions
  addTransaction: (transaction: Omit<TransactionRecord, 'id' | 'timestamp'>) => void;
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<TransactionSettings>) => void;
  setProcessing: (processing: boolean) => void;
  getStats: () => { sent: number; confirmed: number; failed: number; avgConfirmTime: number };
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  settings: {
    pixelsPerTransaction: 1,
    batchSize: 10,
    bundleSize: 5,
    autoSend: true,
    maxTPS: 50,
  },
  isProcessing: false,
  totalSent: 0,
  totalConfirmed: 0,
  totalFailed: 0,

  addTransaction: (transaction) => {
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    set(state => ({
      transactions: [newTransaction, ...state.transactions].slice(0, 500), // Keep last 500
      totalSent: state.totalSent + 1,
    }));
  },

  updateTransaction: (id, updates) => {
    set(state => {
      const transactions = state.transactions.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      );
      
      let totalConfirmed = state.totalConfirmed;
      let totalFailed = state.totalFailed;
      
      if (updates.status === 'confirmed') totalConfirmed++;
      if (updates.status === 'failed') totalFailed++;
      
      return { transactions, totalConfirmed, totalFailed };
    });
  },

  clearHistory: () => set({
    transactions: [],
    totalSent: 0,
    totalConfirmed: 0,
    totalFailed: 0,
  }),

  updateSettings: (newSettings) => set(state => ({
    settings: { ...state.settings, ...newSettings }
  })),

  setProcessing: (processing) => set({ isProcessing: processing }),

  getStats: () => {
    const { transactions } = get();
    const confirmed = transactions.filter(tx => tx.status === 'confirmed');
    const failed = transactions.filter(tx => tx.status === 'failed');
    const avgConfirmTime = confirmed.reduce((acc, tx) => 
      acc + (tx.confirmationTime || 0), 0) / (confirmed.length || 1);

    return {
      sent: transactions.length,
      confirmed: confirmed.length,
      failed: failed.length,
      avgConfirmTime,
    };
  },
}));