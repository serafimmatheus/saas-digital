import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { roleSchema } from '@saas/auth'

export async function updateMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/api/v1/organization/:slug/members/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Update members by organization slug',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
            memberId: z.string(),
          }),
          body: z.object({
            role: roleSchema,
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

        if (cannot('update', 'User')) {
          throw new UnauthorizedError('You are not allowed to update a member')
        }

        const { role } = req.body

        await prisma.member.update({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
          data: {
            role,
          },
        })

        return res.status(204).send()
      },
    )
}
