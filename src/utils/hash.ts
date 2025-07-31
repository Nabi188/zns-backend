//  utils/hash.ts

import bcrypt from 'bcryptjs'
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
