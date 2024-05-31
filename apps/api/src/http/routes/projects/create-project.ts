import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { createSlug } from '@/utils/create-slug'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/api/v1/organization/:slug/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Create an project',
          security: [
            {
              bearerAuth: [],
            },
          ],
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              projectId: z.string().cuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const { memberShip, organization } = await req.getUserMemberShip(slug)
        const userId = await req.getCurrentUserId()
        const { name, description } = req.body

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('create', 'Project')) {
          throw new UnauthorizedError('You are not allowed to create a project')
        }

        const project = await prisma.project.create({
          data: {
            name,
            slug: createSlug(name),
            description,
            organizationId: organization.id,
            ownerId: userId,
          },
        })

        return res.status(201).send({ projectId: project.id })
      },
    )
}
