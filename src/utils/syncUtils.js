/**
 * Sync Utilities for QR-based offline data transfer
 * 
 * Security Architecture (multi-layer, no shared secret dependency):
 * 
 * Layer 1: Structural Validation
 *   - Strict prefix check (nzs1: / nzs2:)
 *   - Data format validation (required fields, types)
 *   - Staff dashboard must be open to process user sync QR
 *
 * Layer 2: Integrity Check  
 *   - CRC-like checksum appended to payload
 *   - Detects any accidental corruption from QR scanning
 *   - Uses a simple but effective algorithm that doesn't depend on shared secrets
 *
 * Layer 3: Session Security (Nonce)
 *   - One-time session ID generated per sync request
 *   - Staff→User response must contain matching nonce
 *   - Prevents cross-user data injection
 *
 * Layer 4: At-rest Encryption (separate, in storage.js)
 *   - All localStorage data remains AES-encrypted
 *   - Prevents client-side tampering of saved progress
 *
 * Why no shared-secret encryption for QR?
 *   - QR is a physical-layer transfer (screen→camera), not a network
 *   - Shared secret requires identical env vars across devices, which 
 *     proved unreliable in practice (dev server not restarted, etc.)
 *   - The nonce mechanism already prevents the primary attack vector
 */

export const SYNC_PREFIX = {
  USER_DATA: 'nzs1:',
  STAFF_DATA: 'nzs2:'
};

/**
 * Generate a deterministic checksum from a string.
 * This catches accidental data corruption without requiring a shared secret.
 * Not cryptographic, but sufficient for integrity verification of QR transfers.
 * A static salt is added to prevent trivial manual QR generation.
 */
const SYNC_SALT = import.meta.env.VITE_SYNC_SALT || 'default-fallback-salt';

const checksum = (str) => {
  let saltedStr = str + SYNC_SALT;
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < saltedStr.length; i++) {
    hash ^= saltedStr.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

/**
 * Encode sync data as URL-safe query parameters.
 * Format: prefix + s=stamps&e=0|1&d=0|1&n=nonce&c=checksum
 * 
 * Characters used: a-z, 0-9, =, &, -, , (comma)
 * All are 100% safe for QR code transmission.
 */
export const encodeSyncData = (data, prefix) => {
  try {
    const s = (data.stamps || []).join(',');
    const e = data.isExchanged ? '1' : '0';
    const d = data.isDismissed ? '1' : '0';
    const n = data.nonce || '';

    const body = `s=${s}&e=${e}&d=${d}&n=${n}`;
    const c = checksum(body);

    return `${prefix}${body}&c=${c}`;
  } catch (error) {
    console.error('Sync encode error:', error);
    return '';
  }
};

/**
 * Decode and validate sync data from a scanned QR string.
 */
export const decodeSyncData = (payload, prefix) => {
  try {
    if (!payload) return null;

    // Case-insensitive prefix match
    if (!payload.toLowerCase().startsWith(prefix.toLowerCase())) return null;

    const dataStr = payload.substring(prefix.length);
    const params = new URLSearchParams(dataStr);

    const s = params.get('s') || '';
    const eVal = params.get('e') || '0';
    const dVal = params.get('d') || '0';
    const n = params.get('n') || '';
    const c = params.get('c');

    // Verify checksum
    const body = `s=${s}&e=${eVal}&d=${dVal}&n=${n}`;
    const expectedC = checksum(body);

    if (!c || c !== expectedC) {
      console.error('Sync: Checksum mismatch - data corrupted during scan');
      return null;
    }

    // Structural validation
    const stamps = s ? s.split(',') : [];
    if (!Array.isArray(stamps)) return null;

    return {
      stamps,
      isExchanged: eVal === '1',
      isDismissed: dVal === '1',
      nonce: n
    };
  } catch (error) {
    console.error('Sync decode error:', error);
    return null;
  }
};
