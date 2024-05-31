import { auth } from '@/http/middlewares/auth'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { prisma } from '@/lib/prisma'

export async function getOrganizationBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organizations/:slug/billing',
      {
        schema: {
          tags: ['Billing'],
          summary: 'Get organization by slug',
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
              billing: z.object({
                seats: z.object({
                  ammount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                projects: z.object({
                  ammount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                total: z.number(),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const userId = await req.getCurrentUserId()
        const { organization, memberShip } = await req.getUserMemberShip(slug)

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('read', 'Billing')) {
          throw new UnauthorizedError(
            'You are not allowed to read billing information',
          )
        }

        const [amountOfMembers, amountOfProjects] = await Promise.all([
          prisma.member.count({
            where: {
              organizationId: organization.id,
              role: { not: 'BILLING' },
            },
          }),

          prisma.project.count({
            where: {
              organizationId: organization.id,
            },
          }),
        ])

        return res.status(200).send({
          billing: {
            seats: {
              ammount: amountOfMembers,
              unit: 10,
              price: amountOfMembers * 10,
            },
            projects: {
              ammount: amountOfProjects,
              unit: 20,
              price: amountOfProjects * 20,
            },

            total: amountOfMembers * 10 + amountOfProjects * 20,
          },
        })
      },
    )
}
