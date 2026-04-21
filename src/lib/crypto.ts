/**
 * Client-side encryption utilities for sensitive data.
 *
 * Uses the Web Crypto API (SubtleCrypto) with AES-GCM 256-bit encryption.
 * This protects values stored in localStorage / sessionStorage from casual
 * inspection or XSS exfiltration.
 *
 * NOTE: This is a defense-in-depth layer. The ultimate protection for API keys
 * is keeping them server-side. NEXT_PUBLIC_ keys are intentionally public
 * (Supabase Row Level Security handles authorization), but encrypting cached
 * tokens/session data adds a layer of protection.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits – recommended for AES-GCM

// ---------------------------------------------------------------------------
// Derive a stable CryptoKey from a passphrase using PBKDF2
// ---------------------------------------------------------------------------
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ---------------------------------------------------------------------------
// Encrypt plaintext → base64 string  (salt + iv + ciphertext)
// ---------------------------------------------------------------------------
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  )

  // Concatenate salt (16) + iv (12) + ciphertext → single ArrayBuffer
  const result = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return bufferToBase64(result)
}

// ---------------------------------------------------------------------------
// Decrypt base64 string → plaintext
// ---------------------------------------------------------------------------
export async function decrypt(encoded: string, passphrase: string): Promise<string> {
  const data = base64ToBuffer(encoded)
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 16 + IV_LENGTH)
  const ciphertext = data.slice(16 + IV_LENGTH)

  const key = await deriveKey(passphrase, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(decrypted)
}

// ---------------------------------------------------------------------------
// Helpers: Secure storage wrappers for localStorage
// ---------------------------------------------------------------------------

const STORAGE_PASSPHRASE = typeof window !== 'undefined'
  ? `sec-ondary-${window.location.origin}-${navigator.userAgent.slice(0, 32)}`
  : 'sec-ondary-server-fallback'

/**
 * Encrypt and save a value in localStorage.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  const encrypted = await encrypt(value, STORAGE_PASSPHRASE)
  localStorage.setItem(key, encrypted)
}

/**
 * Read and decrypt a value from localStorage. Returns null if not found
 * or decryption fails (e.g. corrupted/tampered data).
 */
export async function secureGet(key: string): Promise<string | null> {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return await decrypt(raw, STORAGE_PASSPHRASE)
  } catch {
    // Corrupted or tampered – remove it
    localStorage.removeItem(key)
    return null
  }
}

/**
 * Remove an encrypted value from localStorage.
 */
export function secureRemove(key: string): void {
  localStorage.removeItem(key)
}

// ---------------------------------------------------------------------------
// Base64 ↔ Uint8Array helpers (browser-safe, no Node Buffer needed)
// ---------------------------------------------------------------------------
function bufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ---------------------------------------------------------------------------
// Hash utility (SHA-256) – reusable across the app
// ---------------------------------------------------------------------------
export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
