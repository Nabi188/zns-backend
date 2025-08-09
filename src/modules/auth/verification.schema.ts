import { z } from 'zod'

export const sendOtpSchema = z.object({})
export const sendOtpResponseSchema = z.object({
  message: z.string()
})

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
})
export const verifyOtpResponseSchema = z.object({
  message: z.string()
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
