import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { roleSchema } from '@saas/auth'

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organization/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get invites',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              ivites: z.array(
                z.object({
                  id: z.string().cuid(),
                  email: z.string().email(),
                  role: roleSchema,
                  author: z
                    .object({
                      id: z.string().cuid(),
                      name: z.string().nullable(),
                      email: z.string().email(),
                      avatarUrl: z.string().url().nullable(),
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const { memberShip, organization } = await req.getUserMemberShip(slug)
        const userId = await req.getCurrentUserId()

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('read', 'Invite')) {
          throw new UnauthorizedError('You are not allowed to read invites')
        }

        const ivites = await prisma.invite.findMany({
          where: {
            organizationId: organization.id,
          },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return res.status(200).send({ ivites })
      },
    )
}
