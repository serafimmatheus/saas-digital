import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organization/:orgSlug/projects/:projectSlug',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get a project by slug and organization slug',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            orgSlug: z.string(),
            projectSlug: z.string(),
          }),
          response: {
            200: z.object({
              project: z.object({
                id: z.string().cuid(),
                description: z.string().nullable(),
                name: z.string(),
                slug: z.string(),
                avatarUrl: z.string().nullable(),
                organizationId: z.string().cuid(),
                ownerId: z.string().cuid(),
                owner: z.object({
                  id: z.string().cuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().nullable(),
                }),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { orgSlug, projectSlug } = req.params
        const { memberShip, organization } =
          await req.getUserMemberShip(orgSlug)
        const userId = await req.getCurrentUserId()

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('read', 'Project')) {
          throw new UnauthorizedError('You are not allowed to read a project')
        }

        const project = await prisma.project.findUnique({
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
            description: true,
            avatarUrl: true,
            organizationId: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            slug: projectSlug,
            organizationId: organization.id,
          },
        })

        if (!project) {
          throw new BadRequestError('Project not found')
        }

        return res.status(200).send({ project })
      },
    )
}
