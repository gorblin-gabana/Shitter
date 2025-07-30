import { Keypair } from '@solana/web3.js';
import { createHash, pbkdf2Sync } from 'crypto';

interface InAppWalletData {
  keypair: Keypair;
  address: string;
  createdAt: number;
  userAddress: string; // The external wallet that created this
}

interface InAppWalletState {
  wallet: InAppWalletData | null;
  goodShitsBalance: number; // In GoodShits (1 GORB = 10,000 GoodShits)
  isActive: boolean;
}

// Token economics constants
const GORB_TO_GOODSHITS = 10000; // 1 GORB = 10,000 GoodShits
const TX_FEE_RATE = 0.2; // 20% transaction fee
const INITIAL_BALANCE_GORB = 0.01; // 0.01 GORB = 100 GoodShits
const MIN_BALANCE_FOR_TX = 2; // Minimum 2 GoodShits to cover fees

// Persistent wallet storage
const IN_APP_WALLET_KEY = 'shitter-in-app-wallet-state';

export class InAppWalletService {
  private static instance: InAppWalletService;
  private state: InAppWalletState = {
    wallet: null,
    goodShitsBalance: INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS, // 100 GoodShits
    isActive: false
  };

  private constructor() {
    this.restoreWalletState();
  }

  static getInstance(): InAppWalletService {
    if (!InAppWalletService.instance) {
      InAppWalletService.instance = new InAppWalletService();
    }
    return InAppWalletService.instance;
  }

  /**
   * Create a deterministic persistent in-app wallet with PIN
   */
  async createInAppWallet(
    userAddress: string, 
    pin: string
  ): Promise<InAppWalletData> {
    try {
      console.log('🔐 Creating persistent in-app wallet for address:', userAddress);
      
      // Check if wallet already exists for this user
      const existingWallet = this.getWalletForUser(userAddress);
      if (existingWallet) {
        console.log('✅ Using existing in-app wallet:', existingWallet.address);
        this.state = {
          wallet: existingWallet,
          goodShitsBalance: this.state.goodShitsBalance,
          isActive: true
        };
        return existingWallet;
      }

      // Create deterministic seed from user address and PIN
      // This ensures the same wallet is generated for the same user+PIN combo every time
      const seedMaterial = new Uint8Array([
        ...new TextEncoder().encode(userAddress),
        ...new TextEncoder().encode(pin),
        ...new TextEncoder().encode('shitter-in-app-wallet-v1-persistent')
      ]);

      // Use PBKDF2 to derive a strong 32-byte seed with high iteration count
      const seed = pbkdf2Sync(
        Buffer.from(seedMaterial),
        `shitter-in-app-${userAddress}`, // Use address as part of salt for uniqueness
        100000, // High iteration count for security
        32,
        'sha256'
      );

      // Generate keypair from the derived seed
      const keypair = Keypair.fromSeed(seed);
      const address = keypair.publicKey.toString();

      const now = Date.now();
      const inAppWallet: InAppWalletData = {
        keypair,
        address,
        createdAt: now,
        userAddress
      };

      // Update state
      this.state = {
        wallet: inAppWallet,
        goodShitsBalance: INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS,
        isActive: true
      };

      // Store wallet mapping (address only, no private key)
      this.storeWalletMapping(userAddress, address, now);

      // Persist to localStorage (without private key for security)
      this.persistWalletState();

      console.log('✅ In-app wallet created:', address);
      return inAppWallet;

    } catch (error) {
      console.error('❌ Failed to create in-app wallet:', error);
      throw new Error('Failed to create in-app wallet: ' + (error as Error).message);
    }
  }

  /**
   * Recreate wallet from stored mapping and PIN
   */
  async recreateWallet(userAddress: string, pin: string): Promise<InAppWalletData | null> {
    try {
      const mapping = this.getWalletMapping(userAddress);
      if (!mapping) return null;

      // Recreate the wallet using the same derivation
      const seedMaterial = new Uint8Array([
        ...new TextEncoder().encode(userAddress),
        ...new TextEncoder().encode(pin),
        ...new TextEncoder().encode('shitter-in-app-wallet-v1-persistent')
      ]);

      const seed = pbkdf2Sync(
        Buffer.from(seedMaterial),
        `shitter-in-app-${userAddress}`,
        100000,
        32,
        'sha256'
      );

      const keypair = Keypair.fromSeed(seed);
      const address = keypair.publicKey.toString();

      // Verify the address matches the stored mapping
      if (address !== mapping.address) {
        console.error('❌ Address mismatch - incorrect PIN');
        return null;
      }

      const inAppWallet: InAppWalletData = {
        keypair,
        address,
        createdAt: mapping.createdAt,
        userAddress
      };

      this.state = {
        wallet: inAppWallet,
        goodShitsBalance: mapping.balance || INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS,
        isActive: true
      };

      console.log('✅ In-app wallet recreated:', address);
      return inAppWallet;

    } catch (error) {
      console.error('❌ Failed to recreate wallet:', error);
      return null;
    }
  }

  /**
   * Store wallet mapping (address only, no private key)
   */
  private storeWalletMapping(userAddress: string, walletAddress: string, createdAt: number) {
    const mappings = this.getWalletMappings();
    mappings[userAddress] = {
      address: walletAddress,
      createdAt,
      balance: INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS
    };
    localStorage.setItem('shitter-wallet-mappings', JSON.stringify(mappings));
  }

  /**
   * Get wallet mapping for a user
   */
  private getWalletMapping(userAddress: string) {
    const mappings = this.getWalletMappings();
    return mappings[userAddress] || null;
  }

  /**
   * Get all wallet mappings
   */
  private getWalletMappings() {
    try {
      const stored = localStorage.getItem('shitter-wallet-mappings');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get wallet for user (without recreating keypair)
   */
  private getWalletForUser(userAddress: string): InAppWalletData | null {
    const mapping = this.getWalletMapping(userAddress);
    if (!mapping) return null;

    // Note: This returns wallet data without the private key
    // The keypair needs to be recreated with the PIN
    return null; // Always require PIN to recreate
  }

  /**
   * Get current in-app wallet if active
   */
  getInAppWallet(): InAppWalletData | null {
    if (!this.state.wallet || !this.state.isActive) {
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
   * Authenticate with passkey and return authenticator data
   */
  private async authenticateWithPasskey(signature: Uint8Array, userAddress: string): Promise<Uint8Array> {
    const credentialId = localStorage.getItem('shitter-passkey-id');
    
    const credentialOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: signature.slice(0, 32),
        rpId: window.location.hostname,
        userVerification: "preferred",
        timeout: 30000,
        ...(credentialId ? {
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: "public-key" as PublicKeyCredentialType
          }]
        } : {})
      }
    };

    let credential: Credential | null = null;
    
    try {
      // Try to get existing credential
      credential = await navigator.credentials.get(credentialOptions);
    } catch (getError) {
      console.log('Failed to get credential, trying to create new one...');
      
      // If get fails, try to create new passkey
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: signature.slice(0, 32),
          rp: {
            name: "Shitter Social",
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(userAddress),
            name: userAddress.slice(0, 8) + '...',
            displayName: `Shitter User ${userAddress.slice(0, 8)}...`
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred"
          },
          timeout: 30000,
          attestation: "none"
        }
      };
      
      credential = await navigator.credentials.create(createOptions);
      
      if (credential && credential instanceof PublicKeyCredential) {
        // Store the credential ID for future use
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem('shitter-passkey-id', credentialId);
      }
    }

    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error('Failed to authenticate with passkey');
    }

    // Extract authenticator data
    const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
    if ('authenticatorData' in response) {
      return new Uint8Array(response.authenticatorData);
    } else if ('attestationObject' in response) {
      // For new credentials, just return a hash of the attestation object
      return new Uint8Array(await crypto.subtle.digest('SHA-256', response.attestationObject));
    }
    
    throw new Error('Invalid credential response');
  }

  /**
   * Extend session by recreating with same signature
   */
  async extendSession(signature: Uint8Array, userAddress: string): Promise<boolean> {
    try {
      await this.createSessionWallet(signature, userAddress);
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
   * Persist wallet state to localStorage (without private key)
   */
  private persistWalletState(): void {
    try {
      const stateToStore = {
        address: this.state.wallet?.address || null,
        userAddress: this.state.wallet?.userAddress || null,
        createdAt: this.state.wallet?.createdAt || 0,
        goodShitsBalance: this.state.goodShitsBalance,
        isActive: this.state.isActive
      };

      localStorage.setItem(IN_APP_WALLET_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to persist wallet state:', error);
    }
  }

  /**
   * Restore wallet state from localStorage
   */
  private restoreWalletState(): void {
    try {
      const stored = localStorage.getItem(IN_APP_WALLET_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);

      // Restore state (wallet keypair will need to be recreated with PIN)
      this.state = {
        wallet: null, // Keypair cannot be restored from localStorage for security
        goodShitsBalance: parsed.goodShitsBalance || INITIAL_BALANCE_GORB * GORB_TO_GOODSHITS,
        isActive: false // Will be set to true when wallet is recreated with PIN
      };

      console.log('🔄 Partial wallet state restored. Wallet needs PIN to recreate.');
    } catch (error) {
      console.error('Failed to restore wallet state:', error);
      localStorage.removeItem(IN_APP_WALLET_KEY);
    }
  }
}

// Export singleton instance
export const inAppWalletService = InAppWalletService.getInstance();

// Backwards compatibility
export const sessionWalletService = inAppWalletService;