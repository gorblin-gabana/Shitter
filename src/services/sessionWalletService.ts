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
  goodShitsBalance: number; // In GoodShits (1 GORB = 10,000 GoodShits)
  isActive: boolean;
}

// Token economics constants
const GORB_TO_GOODSHITS = 10000; // 1 GORB = 10,000 GoodShits
const TX_FEE_RATE = 0.2; // 20% transaction fee
const INITIAL_BALANCE_GORB = 0.01; // 0.01 GORB = 100 GoodShits
const MIN_BALANCE_FOR_TX = 2; // Minimum 2 GoodShits to cover fees

// Session duration: 2 hours
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const SESSION_WALLET_KEY = 'session-wallet-state';

export class SessionWalletService {
  private static instance: SessionWalletService;
  private state: SessionWalletState = {
    wallet: null,
    goodShitsBalance: INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS, // 100 GoodShits
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
        goodShitsBalance: INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS, // 100 GoodShits
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
   * Get balance in GORB tokens
   */
  getGorbBalance(): number {
    return this.state.goodShitsBalance / GORB_TO_GOODSHITS;
  }

  /**
   * Format balance for display (with decimals)
   */
  getFormattedBalance(): string {
    const gorbBalance = this.getGorbBalance();
    if (gorbBalance < 0.0001) {
      return `${this.state.goodShitsBalance} GS`;
    }
    return `${gorbBalance.toFixed(4)} GORB`;
  }

  /**
   * Calculate transaction fee for an amount
   */
  calculateTxFee(amount: number): number {
    return Math.ceil(amount * TX_FEE_RATE);
  }

  /**
   * Get total cost including fees
   */
  getTotalCost(amount: number): number {
    return amount + this.calculateTxFee(amount);
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
   * Spend GoodShits tokens for social interactions (includes tx fees)
   */
  spendGoodShits(amount: number, action: string): { success: boolean; fee: number; total: number } {
    if (!this.state.isActive || !this.state.wallet) {
      throw new Error('No active session wallet');
    }

    const fee = this.calculateTxFee(amount);
    const totalCost = amount + fee;

    if (this.state.goodShitsBalance < totalCost) {
      console.log(`❌ Insufficient GoodShits balance for ${action}. Need: ${totalCost}, Have: ${this.state.goodShitsBalance}`);
      return { success: false, fee, total: totalCost };
    }

    this.state.goodShitsBalance -= totalCost;
    this.persistSessionState();
    
    console.log(`💸 ${action}: ${amount} GS + ${fee} GS fee = ${totalCost} GS total. Balance: ${this.state.goodShitsBalance} GS`);
    return { success: true, fee, total: totalCost };
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
   * Get action costs with fees
   */
  getActionCosts() {
    return {
      like: { base: 1, fee: this.calculateTxFee(1), total: this.getTotalCost(1) },
      share: { base: 2, fee: this.calculateTxFee(2), total: this.getTotalCost(2) },
      goodShit: { base: 2, fee: this.calculateTxFee(2), total: this.getTotalCost(2) },
      badShit: { base: 1, fee: this.calculateTxFee(1), total: this.getTotalCost(1) },
      comment: { base: 3, fee: this.calculateTxFee(3), total: this.getTotalCost(3) }
    };
  }

  /**
   * Convert GoodShits to GORB display
   */
  static formatGoodShits(amount: number): string {
    const gorb = amount / GORB_TO_GOODSHITS;
    if (gorb >= 0.0001) {
      return `${gorb.toFixed(4)} GORB`;
    }
    return `${amount} GS`;
  }

  /**
   * Get constants for UI
   */
  static getConstants() {
    return {
      GORB_TO_GOODSHITS,
      TX_FEE_RATE,
      INITIAL_BALANCE_GORB,
      MIN_BALANCE_FOR_TX
    };
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