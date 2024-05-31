import 'fastify'

import { Organization, Member } from '@prisma/client'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId: () => Promise<string>
    getUserMemberShip: (
      slug: string,
    ) => Promise<{ organization: Organization; memberShip: Member }>
  }
}
