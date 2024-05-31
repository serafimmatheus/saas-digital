import { FastifyInstance } from 'fastify'
import { UnauthorizedError } from '../routes/_errors/unauthorizad-error'
import { fastifyPlugin } from 'fastify-plugin'
import { prisma } from '@/lib/prisma'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req) => {
    req.getCurrentUserId = async () => {
      try {
        const { sub } = await req.jwtVerify<{ sub: string }>()
        return sub
      } catch {
        throw new UnauthorizedError('Invalid auth token.')
      }
    }

    req.getUserMemberShip = async (slug: string) => {
      const userId = await req.getCurrentUserId()
      const member = await prisma.member.findFirst({
        where: {
          userId,
          organization: {
            slug,
          },
        },
        include: {
          organization: true,
        },
      })

      if (!member) {
        throw new UnauthorizedError(
          'User is not a member of this organization.',
        )
      }

      const { organization, ...memberShip } = member

      return {
        organization,
        memberShip,
      }
    }
  })
})
