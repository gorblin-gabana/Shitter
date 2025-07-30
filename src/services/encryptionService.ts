import { encryptDirect, decryptDirectString } from '@gorbchain-xyz/chaindecode';

// Define local MemberRole enum
export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

// Basic direct message encryption
export const encryptMessage = async (
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): Promise<any> => {
  try {
    const encrypted = await encryptDirect(
      message,
      recipientPublicKey,
      senderPrivateKey
    );
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Basic direct message decryption
export const decryptMessage = async (
  encryptedMessage: any,
  recipientPrivateKey: string
): Promise<string> => {
  try {
    const decrypted = await decryptDirectString(
      encryptedMessage,
      recipientPrivateKey
    );
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
};

// TODO: Add more advanced encryption features once browser compatibility is resolved
// - Personal encryption/decryption
// - Signature groups
// - Shared key management
// - Data signing and verification