import React, { useState } from 'react';
import { encryptDirect, decryptDirectString } from '@gorbchain-xyz/chaindecode';
import { useWalletStore } from '../stores/walletStore';
import { sessionWalletService } from '../services/sessionWalletService';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const GOODSHITS_PER_MESSAGE = 1; // 1 GoodShits per message

export function ChatPanel() {
  const [recipientPubKey, setRecipientPubKey] = useState('');
  const [message, setMessage] = useState('');
  const [encrypted, setEncrypted] = useState<any>(null);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { connection } = useWalletStore();
  const sessionWallet = sessionWalletService.getSessionWallet();
  const goodShitsBalance = sessionWalletService.getGoodShitsBalance();

  // Encrypt and send message as memo
  const handleSend = async () => {
    setLoading(true);
    setDecrypted(null);
    setError(null);
    setTxStatus(null);
    try {
      if (!sessionWallet || !connection) {
        setError('Session wallet or connection not available.');
        setLoading(false);
        return;
      }
      if (goodShitsBalance < GOODSHITS_PER_MESSAGE) {
        setError('Insufficient GoodShits balance.');
        setLoading(false);
        return;
      }
      // Encrypt message
      const encryptedMsg = await encryptDirect(
        message,
        recipientPubKey,
        sessionWallet.keypair.secretKey,
        { compress: true }
      );
      setEncrypted(encryptedMsg);
      // Prepare memo
      const memo = JSON.stringify({ type: 'dm', to: recipientPubKey, data: encryptedMsg });
      // Create memo instruction
      const memoIx = new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memo, 'utf8'),
      });
      // Create transaction
      const tx = new Transaction().add(memoIx);
      tx.feePayer = sessionWallet.keypair.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      // Sign
      tx.sign(sessionWallet.keypair);
      // Send
      setTxStatus('Sending transaction...');
      const sig = await connection.sendRawTransaction(tx.serialize());
      setTxStatus('Confirming transaction...');
      await connection.confirmTransaction(sig, 'confirmed');
      setTxStatus('Message sent! TX: ' + sig.slice(0, 8) + '...');
      // Deduct GoodShits
      sessionWalletService.spendGoodShits(GOODSHITS_PER_MESSAGE, 'send-message');
    } catch (e) {
      setError('Failed to send: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  // Decrypt message (simulate as recipient, for demo)
  const handleDecrypt = async () => {
    if (!encrypted) return;
    setLoading(true);
    try {
      if (!sessionWallet) throw new Error('No session wallet');
      // Use session wallet as recipient for demo
      const decryptedMsg = await decryptDirectString(encrypted, sessionWallet.keypair.secretKey);
      setDecrypted(decryptedMsg);
    } catch (e) {
      setError('Decryption failed: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-bold text-white mb-4">Encrypted Direct Message</h2>
      <div className="mb-3">
        <label className="block text-gray-400 text-sm mb-1">Recipient Public Key</label>
        <input
          type="text"
          value={recipientPubKey}
          onChange={e => setRecipientPubKey(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 mb-2"
        />
      </div>
      <div className="mb-3">
        <label className="block text-gray-400 text-sm mb-1">Message</label>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 mb-2"
        />
      </div>
      <div className="mb-3 text-sm text-gray-400">GoodShits Balance: <span className="text-green-400 font-bold">{goodShitsBalance}</span></div>
      <button
        onClick={handleSend}
        disabled={loading || !recipientPubKey || !message || !sessionWallet || !connection}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold mb-4"
      >
        {loading ? 'Sending...' : 'Send Encrypted Message'}
      </button>
      {txStatus && (
        <div className="mt-2 p-2 bg-blue-900 text-blue-300 rounded text-xs">{txStatus}</div>
      )}
      {error && (
        <div className="mt-2 p-2 bg-red-900 text-red-300 rounded text-xs">{error}</div>
      )}
      {encrypted && (
        <div className="mt-4 p-3 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-2">Encrypted Message:</div>
          <pre className="text-xs text-green-400 break-all whitespace-pre-wrap">{JSON.stringify(encrypted, null, 2)}</pre>
          <button
            onClick={handleDecrypt}
            disabled={loading || !sessionWallet}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold mt-2"
          >
            {loading ? 'Decrypting...' : 'Decrypt as Recipient'}
          </button>
          {decrypted && (
            <div className="mt-3 p-2 bg-green-900 rounded text-green-200">
              <div className="text-xs mb-1">Decrypted Message:</div>
              <div className="text-base">{decrypted}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 