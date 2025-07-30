import React, { useState } from 'react';
import { encryptMessage, decryptMessage } from '../services/encryptionService';
import { useWalletStore } from '../stores/walletStore';
import { sessionWalletService } from '../services/sessionWalletService';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const GOODSHITS_PER_MESSAGE = 1; // 1 GoodShits per message

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [recipientPubKey, setRecipientPubKey] = useState('');
  const [message, setMessage] = useState('');
  const [encrypted, setEncrypted] = useState<any>(null);
  const [decrypted, setDecrypted] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { connection, sessionWalletActive, goodShitsBalance } = useWalletStore();

  const handleSendMessage = async () => {
    if (!recipientPubKey || !message.trim()) {
      setError('Please enter recipient public key and message');
      return;
    }

    if (!sessionWalletActive) {
      setError('Session wallet not active');
      return;
    }

    if (goodShitsBalance < GOODSHITS_PER_MESSAGE) {
      setError('Insufficient GoodShits balance');
      return;
    }

    if (!connection) {
      setError('No connection available');
      return;
    }

    setIsSending(true);
    setError('');
    setTxStatus('Encrypting message...');

    try {
      // Get session wallet
      const sessionWallet = sessionWalletService.getSessionWallet();
      if (!sessionWallet) {
        throw new Error('Failed to get session wallet');
      }

      // Encrypt the message
      const encryptedMessage = await encryptMessage(
        message,
        recipientPubKey,
        sessionWallet.keypair.secretKey.toString()
      );

      setEncrypted(encryptedMessage);
      setTxStatus('Sending encrypted message on-chain...');

      // Create memo transaction
      const transaction = new Transaction();
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(JSON.stringify({
          type: 'encrypted_message',
          data: encryptedMessage,
          recipient: recipientPubKey,
          timestamp: Date.now()
        }))
      });

      transaction.add(memoInstruction);

      // Send transaction
      const signature = await connection.sendTransaction(transaction, [sessionWallet.keypair]);
      setTxStatus(`Message sent! Signature: ${signature}`);

      // Deduct GoodShits
      sessionWalletService.spendGoodShits(GOODSHITS_PER_MESSAGE, 'send-message');

      // Clear form
      setMessage('');
      setRecipientPubKey('');

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDecryptMessage = async () => {
    if (!encrypted) {
      setError('No encrypted message to decrypt');
      return;
    }

    try {
      // Get session wallet
      const sessionWallet = sessionWalletService.getSessionWallet();
      if (!sessionWallet) {
        throw new Error('Failed to get session wallet');
      }

      const decryptedMessage = await decryptMessage(encrypted, sessionWallet.keypair.secretKey.toString());
      setDecrypted(decryptedMessage);
    } catch (err) {
      console.error('Failed to decrypt message:', err);
      setError(err instanceof Error ? err.message : 'Failed to decrypt message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Encrypted Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* GoodShits Balance */}
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-sm text-gray-300">GoodShits Balance</p>
            <p className="text-lg font-bold text-green-400">{goodShitsBalance} GS</p>
          </div>

          {/* Recipient Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Public Key
            </label>
            <input
              type="text"
              value={recipientPubKey}
              onChange={(e) => setRecipientPubKey(e.target.value)}
              placeholder="Enter recipient's public key"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={isSending || !message.trim() || !recipientPubKey || !sessionWalletActive}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium"
          >
            {isSending ? 'Sending...' : `Send Message (${GOODSHITS_PER_MESSAGE} GS)`}
          </button>

          {/* Transaction Status */}
          {txStatus && (
            <div className="bg-blue-900/20 border border-blue-500 p-3 rounded">
              <p className="text-sm text-blue-300">{txStatus}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 p-3 rounded">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Encrypted Message Display */}
          {encrypted && (
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-sm text-gray-300 mb-2">Encrypted Message:</p>
              <div className="bg-gray-900 p-2 rounded text-xs text-gray-400 break-all">
                {JSON.stringify(encrypted, null, 2)}
              </div>
              <button
                onClick={handleDecryptMessage}
                className="mt-2 bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm"
              >
                Decrypt Message
              </button>
            </div>
          )}

          {/* Decrypted Message Display */}
          {decrypted && (
            <div className="bg-green-900/20 border border-green-500 p-3 rounded">
              <p className="text-sm text-green-300 mb-1">Decrypted Message:</p>
              <p className="text-white">{decrypted}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 