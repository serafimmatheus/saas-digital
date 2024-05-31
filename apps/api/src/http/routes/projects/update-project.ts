import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { projectSchema } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { BadRequestError } from '../_errors/bad-request-error'

export async function updateProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/api/v1/organization/:orgSlug/projects/:slugProject',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Update a project',
          security: [
            {
              bearerAuth: [],
            },
          ],
          body: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
          }),
          params: z.object({
            orgSlug: z.string(),
            slugProject: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const { description, name } = req.body
        const userId = await req.getCurrentUserId()
        const { orgSlug, slugProject } = req.params
        const { memberShip, organization } =
          await req.getUserMemberShip(orgSlug)

        const project = await prisma.project.findUnique({
          where: {
            id: slugProject,
            organizationId: organization.id,
          },
        })

        if (!project) {
          throw new BadRequestError('Project not found')
        }

        const authProject = projectSchema.parse(project)

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('update', authProject)) {
          throw new UnauthorizedError(
            'You are not allowed to update this project',
          )
        }

        await prisma.project.update({
          where: {
            id: slugProject,
            organizationId: organization.id,
          },
          data: {
            description,
            name,
          },
        })

        return res.status(204).send()
      },
    )
}
