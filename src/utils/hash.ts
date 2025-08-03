//  utils/hash.ts

import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const saltRounds = 10

export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, saltRounds)
  return hash
}

export async function verifyPassword(
  candidatePassword: string,
  storedHash: string
): Promise<boolean> {
  const isMatch = await bcrypt.compare(candidatePassword, storedHash)
  return isMatch
}

// Tạo API key ngẫu nhiên, trả về: rawKey, prefix, keyHash
export async function generateApiKey() {
  const rawKey = crypto.randomBytes(32).toString('hex')
  const prefix = rawKey.slice(0, 8)
  const keyHash = await hashPassword(rawKey)

  return { rawKey, prefix, keyHash }
}
