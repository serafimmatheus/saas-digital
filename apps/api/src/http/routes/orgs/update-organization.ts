import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { organizationSchema } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function updateOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/api/v1/organization/:slug',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Update an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { name, domain, shouldAttachUsersByDomain } = req.body
        const { slug } = req.params
        const { memberShip, organization: organizationAuth } =
          await req.getUserMemberShip(slug)

        const authOrganization = organizationSchema.parse(organizationAuth)

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('update', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to update this organization',
          )
        }

        if (domain) {
          const isOrganizationExists = await prisma.organization.findFirst({
            where: {
              domain,
              id: {
                not: organizationAuth.id,
              },
            },
          })

          if (isOrganizationExists) {
            throw new BadRequestError('Organization already exists')
          }
        }

        await prisma.organization.update({
          where: {
            id: organizationAuth.id,
          },
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
          },
        })

        return res.status(204).send()
      },
    )
}
