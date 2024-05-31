import { defineAbilitiesFor, userSchema, type Role } from '@saas/auth'

export function getUserPermissions(userId: string, role: Role) {
  const authUser = userSchema.parse({
    id: userId,
    name: 'John Doe',
    role,
  })

  const ability = defineAbilitiesFor(authUser)

  return ability
}
