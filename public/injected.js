// TrashPack Wallet Provider Injection
(function() {
  'use strict';

  console.log('🚀 TrashPack Wallet Provider Injection starting...');

  // Check if already injected
  if (window.trashpack) {
    console.log('✅ TrashPack wallet already exists on window');
    return;
  }

  console.log('📦 Creating TrashPack wallet provider...');

  // Event system for wallet
  class EventEmitter {
    constructor() {
      this.events = {};
    }

    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
    }

    off(event, callback) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
      if (!this.events[event]) return;
      this.events[event].forEach(callback => callback(data));
    }
  }

  // TrashPack Wallet Provider
  class TrashPackWallet extends EventEmitter {
    constructor() {
      super();
      // Standard wallet adapter properties for better compatibility
      this.isTrashPack = true;
      this.name = 'TrashPack';
      this.url = 'https://trashpack.tech';
      this.icon = '/trashpack.png';
      this.version = '1.2.0';
      this.readyState = 'Installed';
      this.connected = false;
      this.connecting = false;
      this.publicKey = null;
      
      // Additional properties for better compatibility
      this.isConnected = false;
      this.autoConnect = false;
      this.supportedTransactionVersions = ['legacy', 0];

      // Bind methods
      this.connect = this.connect.bind(this);
      this.disconnect = this.disconnect.bind(this);
      this.signTransaction = this.signTransaction.bind(this);
      this.signAllTransactions = this.signAllTransactions.bind(this);
      this.signMessage = this.signMessage.bind(this);
      this.signAndSendTransaction = this.signAndSendTransaction.bind(this);

      // Listen for responses from content script
      window.addEventListener('message', this._handleMessage.bind(this));
    }

    // Connect to wallet
    async connect(options = {}) {
      console.log('🔗 TrashPack connect called with options:', options);
      
      if (this.connecting) {
        throw new Error('Connection request already pending');
      }

      if (this.connected) {
        console.log('✅ Already connected, returning existing publicKey:', this.publicKey);
        return { publicKey: this.publicKey };
      }

      this.connecting = true;
      console.log('⏳ Connecting to TrashPack wallet...');

      try {
        // Mock implementation - simulate successful connection
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        // Generate a more realistic dynamic address for testing
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
        let mockAddress = '';
        for (let i = 0; i < 44; i++) {
          mockAddress += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        console.log('✅ Mock connection successful, setting address:', mockAddress);
        
        this.connected = true;
        this.isConnected = true;
        this.publicKey = mockAddress;
        
        this.emit('connect', this.publicKey);
        this.emit('accountChanged', this.publicKey);
        
        console.log('🎉 TrashPack connection complete!');
        return { publicKey: this.publicKey };
        
      } catch (e) {
        console.error('❌ TrashPack connection failed:', e);
        throw new Error('Connection failed: ' + e.message);
      } finally {
        this.connecting = false;
      }
    }

    // Disconnect from wallet
    async disconnect() {
      if (!this.connected) {
        return;
      }

      try {
        await this._sendMessage('TRASHPACK_DISCONNECT');
        this.connected = false;
        this.isConnected = false;
        this.publicKey = null;
        this.emit('disconnect');
      } catch (error) {
        // Force disconnect even if message fails
        this.connected = false;
        this.isConnected = false;
        this.publicKey = null;
        this.emit('disconnect');
      }
    }

    // Sign transaction
    async signTransaction(transaction) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }

      const response = await this._sendMessage('TRASHPACK_SIGN_TRANSACTION', {
        transaction: this._serializeTransaction(transaction)
      });

      if (response.success) {
        return this._deserializeTransaction(response.signedTransaction);
      } else {
        throw new Error(response.error || 'Transaction signing failed');
      }
    }

    // Sign multiple transactions
    async signAllTransactions(transactions) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }

      const response = await this._sendMessage('TRASHPACK_SIGN_ALL_TRANSACTIONS', {
        transactions: transactions.map(tx => this._serializeTransaction(tx))
      });

      if (response.success) {
        return response.signedTransactions.map(tx => this._deserializeTransaction(tx));
      } else {
        throw new Error(response.error || 'Transaction signing failed');
      }
    }

    // Sign message
    async signMessage(message) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }

      const encodedMessage = new TextEncoder().encode(message);
      const response = await this._sendMessage('TRASHPACK_SIGN_MESSAGE', {
        message: Array.from(encodedMessage)
      });

      if (response.success) {
        return {
          signature: new Uint8Array(response.signature),
          publicKey: this.publicKey
        };
      } else {
        throw new Error(response.error || 'Message signing failed');
      }
    }

    // Sign and send transaction
    async signAndSendTransaction(transaction, options = {}) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }

      const response = await this._sendMessage('TRASHPACK_SIGN_AND_SEND_TRANSACTION', {
        transaction: this._serializeTransaction(transaction),
        options
      });

      if (response.success) {
        return { signature: response.signature };
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
    }

    // Private method to send messages to content script
    _sendMessage(type, data = {}) {
      return new Promise((resolve, reject) => {
        const messageId = Date.now() + Math.random();

        const message = {
          type,
          data,
          messageId,
          source: 'trashpack-injected'
        };

        window.postMessage(message, '*');

        const handleResponse = (event) => {
          if (event.data.type === `${type}_RESPONSE` && event.data.messageId === messageId) {
            window.removeEventListener('message', handleResponse);
            resolve(event.data);
          }
        };

        window.addEventListener('message', handleResponse);

        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          reject(new Error('Request timeout'));
        }, 30000);
      });
    }

    // Handle messages from content script
    _handleMessage(event) {
      if (event.source !== window) return;

      const { type, data } = event.data;

      switch (type) {
        case 'TRASHPACK_ACCOUNT_CHANGED':
          this._handleAccountChanged(data);
          break;
        case 'TRASHPACK_DISCONNECTED':
          this._handleDisconnected();
          break;
        case 'TRASHPACK_GET_CONNECTION_STATUS_RESPONSE':
          // This is handled by the _sendMessage promise mechanism
          break;
      }
    }

    // Handle account change
    _handleAccountChanged(data) {
      const oldPublicKey = this.publicKey;
      // Try to create PublicKey object if available, fallback to string
      if (window.solanaWeb3 && window.solanaWeb3.PublicKey) {
        try {
          this.publicKey = new window.solanaWeb3.PublicKey(data.publicKey);
        } catch (e) {
          this.publicKey = data.publicKey;
        }
      } else {
        this.publicKey = data.publicKey;
      }

      if (oldPublicKey !== this.publicKey) {
        this.emit('accountChanged', this.publicKey);
      }
    }

    // Handle disconnection
    _handleDisconnected() {
      this.connected = false;
      this.isConnected = false;
      this.publicKey = null;
      this.emit('disconnect');
    }

    // Serialize transaction for message passing
    _serializeTransaction(transaction) {
      // Convert transaction to serializable format
      return {
        ...transaction,
        serialize: () => Array.from(transaction.serialize())
      };
    }

    // Deserialize transaction from message
    _deserializeTransaction(serializedTransaction) {
      // Convert back to transaction object
      return serializedTransaction;
    }
  }

  // Create wallet instance
  const trashpack = new TrashPackWallet();

  console.log('🎯 TrashPack wallet instance created:', trashpack);

  // Add to window
  Object.defineProperty(window, 'trashpack', {
    value: trashpack,
    writable: false,
    configurable: false
  });

  console.log('✅ TrashPack wallet added to window.trashpack');

  // Also add to window.solana for compatibility
  if (!window.solana) {
    Object.defineProperty(window, 'solana', {
      value: trashpack,
      writable: false,
      configurable: false
    });
    console.log('✅ TrashPack wallet also added to window.solana');
  }

  // Enhanced wallet registration for better compatibility
  
  // Check if already connected on page load
  (async () => {
    try {
      const response = await trashpack._sendMessage('TRASHPACK_GET_CONNECTION_STATUS');
      if (response && response.success && response.connected && response.publicKey) {
        trashpack.connected = true;
        trashpack.isConnected = true;
        if (window.solanaWeb3 && window.solanaWeb3.PublicKey) {
          try {
            trashpack.publicKey = new window.solanaWeb3.PublicKey(response.publicKey);
          } catch (e) {
            trashpack.publicKey = response.publicKey;
          }
        } else {
          trashpack.publicKey = response.publicKey;
        }
        trashpack.emit('connect', trashpack.publicKey);
      }
    } catch (e) {
      // Silent fail if connection check not available
    }
  })();
  
  // Dispatch TrashPack ready event
  window.dispatchEvent(new CustomEvent('trashpack#initialized', {
    detail: trashpack
  }));

  // Register with wallet standard (multiple methods for broader compatibility)
  window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', {
    detail: {
      register: (callback) => callback(trashpack)
    }
  }));

  // Register with newer wallet standard if available
  if (window.navigator && window.navigator.wallets) {
    try {
      window.navigator.wallets.register(trashpack);
    } catch (e) {
      // Silent fail if registration method not available
    }
  }

  // Add to global wallet registry if it exists
  if (window.wallets) {
    window.wallets.push(trashpack);
  } else {
    window.wallets = [trashpack];
  }

  // Announce availability for wallet adapter libraries
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('wallet:ready', {
      detail: { name: 'TrashPack', wallet: trashpack }
    }));
    
    // Also emit solana:ready for Solana ecosystem compatibility
    window.dispatchEvent(new CustomEvent('solana:ready', {
      detail: { name: 'TrashPack', wallet: trashpack }
    }));
  }, 100);
})();
