import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'

export async function removeMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/api/v1/organization/:slug/members/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Remove members by organization slug',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
            memberId: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const { slug, memberId } = req.params
        const { memberShip, organization } = await req.getUserMemberShip(slug)
        const userId = await req.getCurrentUserId()

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('delete', 'User')) {
          throw new UnauthorizedError('You are not allowed to delete a member')
        }

        await prisma.member.delete({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
        })

        return res.status(204).send()
      },
    )
}
