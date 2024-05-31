import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function revokeInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/api/v1/organization/:slug/invites/:inviteId',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Revoke an invite',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
            inviteId: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const { slug, inviteId } = req.params
        const { memberShip, organization } = await req.getUserMemberShip(slug)
        const userId = await req.getCurrentUserId()

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('delete', 'Invite')) {
          throw new UnauthorizedError('You are not allowed to create an invite')
        }

        const invite = await prisma.invite.findUnique({
          where: {
            id: inviteId,
            organizationId: organization.id,
          },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found or expired')
        }

        await prisma.invite.delete({
          where: {
            id: inviteId,
          },
        })

        return res.status(204).send()
      },
    )
}
