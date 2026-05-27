import { z } from 'zod'

export const registerSchema = z.object({
  companyName: z.string().min(2).max(100),
  companyEmail: z.email(),
  companyPhone: z.string().optional(),
  userName: z.string().min(2).max(100),
  userEmail: z.email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export const loginSchema = z.object({
  companySlug: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
