import { Keypair } from '@solana/web3.js';
import { createHash, pbkdf2Sync } from 'crypto';

interface SessionWalletData {
  keypair: Keypair;
  address: string;
  createdAt: number;
  expiresAt: number;
}

interface SessionWalletState {
  wallet: SessionWalletData | null;
  goodShitsBalance: number;
  isActive: boolean;
}

// Session duration: 2 hours
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const SESSION_WALLET_KEY = 'session-wallet-state';

export class SessionWalletService {
  private static instance: SessionWalletService;
  private state: SessionWalletState = {
    wallet: null,
    goodShitsBalance: 100, // Start with 100 GoodShits tokens
    isActive: false
  };

  private constructor() {
    this.restoreSessionState();
  }

  static getInstance(): SessionWalletService {
    if (!SessionWalletService.instance) {
      SessionWalletService.instance = new SessionWalletService();
    }
    return SessionWalletService.instance;
  }

  /**
   * Create a deterministic session wallet from user signature and PIN
   */
  async createSessionWallet(
    signature: Uint8Array, 
    userAddress: string, 
    pin: string
  ): Promise<SessionWalletData> {
    try {
      console.log('🔐 Creating session wallet from signature and PIN');
      
      // Create a deterministic seed from signature + address + PIN
      const seedMaterial = new Uint8Array([
        ...signature,
        ...new TextEncoder().encode(userAddress),
        ...new TextEncoder().encode(pin),
        ...new TextEncoder().encode('shitter-session-wallet-v1') // Version salt
      ]);

      // Use PBKDF2 to derive a strong 32-byte seed
      const seed = pbkdf2Sync(
        Buffer.from(seedMaterial),
        'shitter-session-salt-2024', // Salt
        10000, // Iterations
        32, // Key length
        'sha256'
      );

      // Generate keypair from the derived seed
      const keypair = Keypair.fromSeed(seed);
      const address = keypair.publicKey.toString();

      const now = Date.now();
      const sessionWallet: SessionWalletData = {
        keypair,
        address,
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS
      };

      // Update state
      this.state = {
        wallet: sessionWallet,
        goodShitsBalance: 100, // Reset to 100 GoodShits tokens
        isActive: true
      };

      // Persist to localStorage (without private key for security)
      this.persistSessionState();

      console.log('✅ Session wallet created:', address);
      return sessionWallet;

    } catch (error) {
      console.error('❌ Failed to create session wallet:', error);
      throw new Error('Failed to create session wallet');
    }
  }

  /**
   * Get current session wallet if active and not expired
   */
  getSessionWallet(): SessionWalletData | null {
    if (!this.state.wallet || !this.state.isActive) {
      return null;
    }

    // Check if expired
    if (Date.now() > this.state.wallet.expiresAt) {
      console.log('⏰ Session wallet expired, clearing state');
      this.clearSession();
      return null;
    }

    return this.state.wallet;
  }

  /**
   * Get GoodShits token balance
   */
  getGoodShitsBalance(): number {
    return this.state.goodShitsBalance;
  }

  /**
   * Update GoodShits balance (for transactions)
   */
  updateGoodShitsBalance(newBalance: number): void {
    if (newBalance < 0) {
      throw new Error('GoodShits balance cannot be negative');
    }
    
    this.state.goodShitsBalance = newBalance;
    this.persistSessionState();
    
    console.log('💰 GoodShits balance updated:', newBalance);
  }

  /**
   * Spend GoodShits tokens for social interactions
   */
  spendGoodShits(amount: number, action: string): boolean {
    if (!this.state.isActive || !this.state.wallet) {
      throw new Error('No active session wallet');
    }

    if (this.state.goodShitsBalance < amount) {
      console.log(`❌ Insufficient GoodShits balance for ${action}`);
      return false;
    }

    this.state.goodShitsBalance -= amount;
    this.persistSessionState();
    
    console.log(`💸 Spent ${amount} GoodShits for ${action}. Remaining: ${this.state.goodShitsBalance}`);
    return true;
  }

  /**
   * Add GoodShits tokens (from rewards, purchases, etc.)
   */
  addGoodShits(amount: number, source: string): void {
    if (!this.state.isActive) {
      throw new Error('No active session wallet');
    }

    this.state.goodShitsBalance += amount;
    this.persistSessionState();
    
    console.log(`💎 Received ${amount} GoodShits from ${source}. Total: ${this.state.goodShitsBalance}`);
  }

  /**
   * Check if session wallet is active and not expired
   */
  isSessionActive(): boolean {
    if (!this.state.isActive || !this.state.wallet) {
      return false;
    }

    // Check expiration
    if (Date.now() > this.state.wallet.expiresAt) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * Get time remaining in session (in minutes)
   */
  getTimeRemaining(): number {
    if (!this.state.wallet) return 0;
    
    const remaining = this.state.wallet.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / (1000 * 60)));
  }

  /**
   * Clear session wallet and state
   */
  clearSession(): void {
    console.log('🧹 Clearing session wallet state');
    
    this.state = {
      wallet: null,
      goodShitsBalance: 0,
      isActive: false
    };

    // Clear from localStorage
    localStorage.removeItem(SESSION_WALLET_KEY);
  }

  /**
   * Extend session by recreating with same signature and PIN
   */
  async extendSession(signature: Uint8Array, userAddress: string, pin: string): Promise<boolean> {
    try {
      await this.createSessionWallet(signature, userAddress, pin);
      return true;
    } catch (error) {
      console.error('❌ Failed to extend session:', error);
      return false;
    }
  }

  /**
   * Persist session state to localStorage (without private key)
   */
  private persistSessionState(): void {
    try {
      const stateToStore = {
        address: this.state.wallet?.address || null,
        createdAt: this.state.wallet?.createdAt || 0,
        expiresAt: this.state.wallet?.expiresAt || 0,
        goodShitsBalance: this.state.goodShitsBalance,
        isActive: this.state.isActive
      };

      localStorage.setItem(SESSION_WALLET_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to persist session state:', error);
    }
  }

  /**
   * Restore session state from localStorage
   */
  private restoreSessionState(): void {
    try {
      const stored = localStorage.getItem(SESSION_WALLET_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(SESSION_WALLET_KEY);
        return;
      }

      // Restore state (wallet keypair will need to be recreated with signature + PIN)
      this.state = {
        wallet: null, // Keypair cannot be restored from localStorage for security
        goodShitsBalance: parsed.goodShitsBalance || 0,
        isActive: false // Will be set to true when wallet is recreated
      };

      console.log('🔄 Partial session state restored. Wallet needs to be recreated.');
    } catch (error) {
      console.error('Failed to restore session state:', error);
      localStorage.removeItem(SESSION_WALLET_KEY);
    }
  }
}

// Export singleton instance
export const sessionWalletService = SessionWalletService.getInstance();