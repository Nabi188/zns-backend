// // utils/hash.ts

// import crypto from 'crypto'

// export function hashPassword(password: string) {
//   const salt = crypto.randomBytes(16).toString('hex')
//   const hash = crypto
//     .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
//     .toString('hex')
//   return { hash, salt }
// }

// export function verifyPassword({
//   candidatePassword,
//   salt,
//   hash
// }: {
//   candidatePassword: string
//   salt: string
//   hash: string
// }) {
//   const candidateHash = crypto
//     .pbkdf2Sync(candidatePassword, salt, 1000, 64, 'sha512')
//     .toString('hex')

//   return candidateHash === hash
// }

// utils/hash.ts

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
