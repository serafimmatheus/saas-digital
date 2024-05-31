import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/v1/users',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Create a new account',
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(8, {
            message: 'Password must be at least 8 characters long.',
          }),
        }),
      },
    },
    async (req, res) => {
      const { name, email, password } = req.body

      const userWidthEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userWidthEmail) {
        throw new BadRequestError('Email already in use.')
      }

      const [, domain] = email.split('@')

      const autoJoinOrganization = await prisma.organization.findFirst({
        where: {
          domain,
          shouldAttachUsersByDomain: true,
        },
      })

      const passwordHash = await hash(password, 8)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          member_on: autoJoinOrganization
            ? {
                create: {
                  organizationId: autoJoinOrganization.id,
                },
              }
            : undefined,
        },
      })

      return res.status(201).send(user)
    },
  )
}
