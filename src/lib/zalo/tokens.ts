// lib/tokens.ts
// import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import crypto from 'crypto'
import { envConfig } from '../envConfig'

const ENCRYPTION_KEY = envConfig.ENCRYPTION_KEY

function loadKey(): Buffer {
  const raw = ENCRYPTION_KEY
  try {
    const k = Buffer.from(raw, 'base64')
    if (k.length === 32) return k
  } catch {}
  const maybeHex = /^[0-9a-fA-F]+$/.test(raw) && raw.length === 64
  const k2 = maybeHex ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'utf8')
  if (k2.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 preferred).')
  }
  return k2
}

const KEY = loadKey()

//Mã hoá token trươc s khi lưu DB
export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

// giải mã token
export function decryptToken(payloadB64: string): string {
  const buf = Buffer.from(payloadB64, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}
