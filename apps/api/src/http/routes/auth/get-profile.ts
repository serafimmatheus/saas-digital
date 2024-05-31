import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { auth } from '@/http/middlewares/auth'

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/profile',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Get authenticated user profile',
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            200: z.object({
              user: z.object({
                id: z.string().cuid(),
                email: z.string().email(),
                name: z.string().nullable(),
                avatarUrl: z.string().url().nullable(),
              }),
            }),
            404: z.object({
              message: z.string(),
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
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        return res.send({
          user,
        })
      },
    )
}
