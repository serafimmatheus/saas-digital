import { AbilityBuilder } from '@casl/ability'
import { AppAbility } from '.'
import { User } from './models/user'
import { Role } from './roles'

type PermissionBYRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionBYRole> = {
  ADMIN(user, { can, cannot }) {
    can('manage', 'all')

    cannot(['transfer_ownership', 'update', 'delete'], 'Organization')
    can(['transfer_ownership', 'update', 'delete'], 'Organization', {
      ownerId: { $eq: user.id },
    })
  },
  MEMBER(user, { can }) {
    can('read', 'User')
    can(['create', 'read'], 'Project')
    can(['update', 'delete'], 'Project', { ownerId: { $eq: user.id } })
  },
  BILLING(_, { can }) {
    can('manage', 'Billing')
  },
  USER(_, { can }) {
    can(['read'], 'User')
    can(['read', 'create'], 'Project')
    can(['read'], 'Organization')
  },
  DEVELOP(user, { can, cannot }) {
    can('manage', 'all')

    cannot(['update', 'delete'], 'Project')
    can(['update', 'delete'], 'Project', { ownerId: { $eq: user.id } })
    cannot(['transfer_ownership', 'update', 'delete'], 'Organization')
    can(['transfer_ownership', 'update', 'delete'], 'Organization', {
      ownerId: { $eq: user.id },
    })

    cannot(['manage'], 'Billing')
  },
}
