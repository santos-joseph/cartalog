import { z } from 'zod'

export const registerSchema = z.object({
  companyName: z.string().min(2).max(100),
  companyEmail: z.email().transform((value) => value.trim().toLowerCase()),
  companyPhone: z.string().optional(),
  userName: z.string().min(2).max(100),
  userEmail: z.email().transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
