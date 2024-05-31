import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { organizationSchema } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { BadRequestError } from '../_errors/bad-request-error'

export async function transferOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/api/v1/organization/:slug/owner',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Transfer organization ownership',
          security: [
            {
              bearerAuth: [],
            },
          ],
          body: z.object({
            transferToUserId: z.string().cuid(),
          }),
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
        const { transferToUserId } = req.body
        const { slug } = req.params
        const { memberShip, organization: organizationAuth } =
          await req.getUserMemberShip(slug)

        const authOrganization = organizationSchema.parse(organizationAuth)

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('transfer_ownership', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to transfer this organization ownership',
          )
        }

        const transferToMemberShip = await prisma.member.findUnique({
          where: {
            userId_organizationId: {
              userId: transferToUserId,
              organizationId: organizationAuth.id,
            },
          },
        })

        if (!transferToMemberShip) {
          throw new BadRequestError('User is not a member of this organization')
        }

        await prisma.$transaction([
          prisma.member.update({
            where: {
              userId_organizationId: {
                userId: transferToUserId,
                organizationId: organizationAuth.id,
              },
            },
            data: {
              role: 'ADMIN',
            },
          }),

          prisma.organization.update({
            where: {
              id: organizationAuth.id,
            },
            data: {
              ownerId: transferToUserId,
            },
          }),
        ])

        return res.status(204).send()
      },
    )
}
