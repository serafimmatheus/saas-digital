import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { auth } from '@/http/middlewares/auth'
import z from 'zod'
import { roleSchema } from '@saas/auth'

export async function getPendingInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/pending-invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get pending invites',
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            200: z.object({
              invites: z.object({
                id: z.string().cuid(),
                email: z.string().email(),
                role: roleSchema,
                organization: z.object({
                  name: z.string(),
                }),
                author: z
                  .object({
                    id: z.string().cuid(),
                    name: z.string().nullable(),
                    email: z.string().email(),
                    avatarUrl: z.string().url().nullable(),
                  })
                  .nullable(),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        const invites = await prisma.invite.findUnique({
          select: {
            id: true,
            email: true,
            role: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            organization: {
              select: {
                name: true,
              },
            },
          },
          where: {
            email: user.email,
          },
        })

        if (!invites) {
          throw new BadRequestError('Invite not found or expired')
        }

        return res.status(200).send({ invites })
      },
    )
}
