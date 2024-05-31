import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { roleSchema } from '@saas/auth'

export async function getMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organization/:slug/members',
      {
        schema: {
          tags: ['Members'],
          summary: 'Get all members by organization slug',
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
              members: z.array(
                z.object({
                  id: z.string().cuid(),
                  userId: z.string().cuid(),
                  role: roleSchema,
                  name: z.string().nullish(),
                  email: z.string().email(),
                  avatarUrl: z.string().url().nullish(),
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

        if (cannot('read', 'User')) {
          throw new UnauthorizedError('You are not allowed to read members')
        }

        const members = await prisma.member.findMany({
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            role: 'asc',
          },
        })

        const membersWithRole = members.map((member) => {
          return {
            id: member.id,
            role: member.role,
            userId: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl,
          }
        })

        return res.status(200).send({ members: membersWithRole })
      },
    )
}
