import { z } from 'zod'
import { roleSchema } from '../roles'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  role: roleSchema,
})

export type User = z.infer<typeof userSchema>
