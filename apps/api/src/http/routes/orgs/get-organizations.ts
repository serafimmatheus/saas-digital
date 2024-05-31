import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { roleSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organizations',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Get organization where user is a member',
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.string().cuid(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().url().nullish(),
                  role: roleSchema,
                }),
              ),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            members: {
              select: {
                role: true,
              },
              where: {
                userId,
              },
            },
          },
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        })

        const organizationsWithRole = organizations.map(
          ({ members, ...org }) => {
            return {
              ...org,
              role: members[0].role,
            }
          },
        )

        return res.status(200).send({ organizations: organizationsWithRole })
      },
    )
}
