import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { createSlug } from '@/utils/create-slug'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/api/v1/organization',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Create an organization',
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
          response: {
            201: z.object({
              organizationId: z.string().cuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { name, domain, shouldAttachUsersByDomain } = req.body

        if (domain) {
          const organization = await prisma.organization.findFirst({
            where: {
              domain,
            },
          })

          if (organization) {
            throw new BadRequestError('Organization already exists')
          }
        }

        const organization = await prisma.organization.create({
          data: {
            name,
            domain,
            slug: createSlug(name),
            shouldAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        return res.status(201).send({ organizationId: organization.id })
      },
    )
}
