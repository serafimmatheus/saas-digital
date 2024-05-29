import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/api/v1/users',
    {
      schema: {
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
        return res.status(400).send({
          message: 'Email already in use.',
        })
      }

      const passwordHash = await hash(password, 8)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
        },
      })

      return res.status(201).send(user)
    },
  )
}
