import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { roleSchema } from '@saas/auth'

export async function getInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/api/v1/invites/:inviteId',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Get an invite',
        security: [
          {
            bearerAuth: [],
          },
        ],
        params: z.object({
          inviteId: z.string(),
        }),
        response: {
          200: z.object({
            invite: z.object({
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
      const { inviteId } = req.params

      const invite = await prisma.invite.findUnique({
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
          id: inviteId,
        },
      })

      if (!invite) {
        throw new BadRequestError('Invite not found')
      }

      return res.status(200).send({ invite })
    },
  )
}
