import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { hash } from 'bcryptjs'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/v1/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request password reset',
        body: z.object({
          code: z.string(),
          password: z.string().min(8, {
            message: 'Password must be at least 8 characters long.',
          }),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (req, res) => {
      const { code, password } = req.body

      const tokenFromCode = await prisma.token.findUnique({
        where: {
          id: code,
        },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError('Invalid code')
      }

      const passwordHash = await hash(password, 8)

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: tokenFromCode.userId,
          },
          data: {
            password: passwordHash,
          },
        }),

        prisma.token.delete({
          where: {
            id: code,
          },
        }),
      ])

      return res.status(204).send()
    },
  )
}
