import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'

export async function getProjects(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organization/:slug/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get all projects by organization slug',
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
              projects: z.array(
                z.object({
                  id: z.string().cuid(),
                  description: z.string().nullable(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().nullable(),
                  organizationId: z.string().cuid(),
                  ownerId: z.string().cuid(),
                  createdAt: z.date(),
                  owner: z.object({
                    id: z.string().cuid(),
                    name: z.string().nullable(),
                    avatarUrl: z.string().nullable(),
                  }),
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

        if (cannot('read', 'Project')) {
          throw new UnauthorizedError('You are not allowed to read a project')
        }

        const projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
            description: true,
            avatarUrl: true,
            organizationId: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return res.status(200).send({ projects })
      },
    )
}
