import { z } from 'zod'

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('USER'),
  z.literal('MEMBER'),
  z.literal('BILLING'),
  z.literal('DEVELOP'),
])

export type Role = z.infer<typeof roleSchema>
