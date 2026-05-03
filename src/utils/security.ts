import CryptoJS from 'crypto-js';

// In a real application, this key should be stored in a secure location like React Native Keychain
// or retrieved from a secure backend. For this implementation, we use a consistent key for the session.
const ENCRYPTION_KEY = 'TaskMate-secure-storage-key-12345';

/**
 * Encrypts a string using AES
 */
export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return data;
  }
};

/**
 * Decrypts an AES encrypted string
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Return original if decryption fails (e.g., if data wasn't encrypted)
  }
};

/**
 * Encrypts an object by converting it to JSON first
 */
export const encryptObject = (obj: any): string => {
  return encryptData(JSON.stringify(obj));
};

/**
 * Decrypts a JSON string back into an object
 */
export const decryptObject = (encryptedData: string): any | null => {
  try {
    const decryptedJson = decryptData(encryptedData);
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Failed to parse decrypted object:', error);
    return null;
  }
};
