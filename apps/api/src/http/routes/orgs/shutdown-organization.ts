import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { organizationSchema } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function shutdownOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/api/v1/organization/:slug',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Shutdown an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { slug } = req.params
        const { memberShip, organization } = await req.getUserMemberShip(slug)

        const authOrganization = organizationSchema.parse({
          id: organization.id,
          ownerId: organization.ownerId,
        })

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('delete', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to shutdown this organization',
          )
        }

        await prisma.organization.delete({
          where: {
            id: organization.id,
          },
        })

        return res.status(204).send()
      },
    )
}
