import { useCallback } from 'react';
import { Transaction, SystemProgram, PublicKey, Connection, TransactionInstruction } from '@solana/web3.js';
import { useWalletStore } from '../stores/walletStore';
import { useTransactionStore } from '../stores/transactionStore';

// Memo program address
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Send a transaction with a memo (for posting on-chain social content)
 * @param connection Solana connection
 * @param payer PublicKey of the fee payer
 * @param signTransaction Function to sign the transaction
 * @param memo The memo string (post content, or JSON with IPFS hash)
 * @returns transaction signature
 */
export async function sendMemoTransaction({
  connection,
  payer,
  signTransaction,
  memo
}: {
  connection: Connection,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  memo: string
}): Promise<string> {
  // Create memo instruction
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf8'),
  });
  // Create transaction
  const tx = new Transaction().add(memoIx);
  tx.feePayer = payer;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  // Sign
  const signed = await signTransaction(tx);
  // Send
  const sig = await connection.sendRawTransaction(signed.serialize());
  // Optionally, confirm
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export function useTransactionService() {
  const { connection, tempWallet } = useWalletStore();
  const { addTransaction, updateTransaction, settings } = useTransactionStore();

  const processPixelAction = useCallback(async (x: number, y: number, color: string) => {
    if (!connection || !tempWallet || !settings.autoSend) return;

    try {
      // Create a simple transaction (no-op for demo)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: tempWallet.publicKey,
          toPubkey: tempWallet.publicKey, // Self-transfer for demo
          lamports: 1, // Minimal amount
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = tempWallet.publicKey;

      // Sign transaction
      transaction.sign(tempWallet);

      // Add to history
      const txRecord = addTransaction({
        type: 'pixel',
        status: 'pending',
        details: `Pixel (${x}, ${y}) - ${color}`,
        pixelData: { x, y, color },
      });

      // Send transaction
      const signature = await connection.sendRawTransaction(transaction.serialize());
      
      updateTransaction(txRecord.id, { signature });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        updateTransaction(txRecord.id, { 
          status: 'failed',
          confirmationTime: Date.now() - txRecord.timestamp 
        });
      } else {
        updateTransaction(txRecord.id, { 
          status: 'confirmed',
          confirmationTime: Date.now() - txRecord.timestamp 
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      // Update the last transaction as failed
      const lastTx = useTransactionStore.getState().transactions[0];
      if (lastTx && lastTx.status === 'pending') {
        updateTransaction(lastTx.id, { status: 'failed' });
      }
    }
  }, [connection, tempWallet, settings.autoSend, addTransaction, updateTransaction]);

  return { processPixelAction };
}