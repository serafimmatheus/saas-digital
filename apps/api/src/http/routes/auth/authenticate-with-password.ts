import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/v1/session/password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with e-mail and password',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8, {
            message: 'Password must be at least 8 characters long.',
          }),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (req, res) => {
      const { email, password } = req.body

      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!userFromEmail) {
        throw new BadRequestError('Invalid e-mail or password.')
      }

      if (userFromEmail.password === null) {
        throw new BadRequestError(
          'User does not have a password, use social login.',
        )
      }

      const isPasswordMatch = await compare(password, userFromEmail.password)

      if (!isPasswordMatch) {
        throw new BadRequestError('Invalid e-mail or password.')
      }

      const token = await res.jwtSign(
        {
          sub: userFromEmail.id,
        },
        {
          expiresIn: '7h',
        },
      )

      return res.status(201).send({
        token,
      })
    },
  )
}
