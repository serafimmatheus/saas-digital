import { defineAbilitiesFor, projectSchema } from '@saas/auth'

const ability = defineAbilitiesFor({
  role: 'ADMIN',
  id: '1',
  name: 'Matheus Serafim',
})

const project = projectSchema.parse({
  id: '1111',
  ownerId: '2',
})

console.log(ability.can('read', 'Project'))
console.log(ability.can('create', 'Project'))
console.log(ability.can('delete', project))
console.log(ability.can('update', project))
