import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { auth } from '@/http/middlewares/auth'

export async function rejectInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/api/v1/invites/:inviteId/reject',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Reject an invite',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            inviteId: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { inviteId } = req.params

        const invite = await prisma.invite.findUnique({
          where: {
            id: inviteId,
          },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found or expired')
        }

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        if (invite.email !== user.email) {
          throw new BadRequestError('Invite does not match user email')
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
