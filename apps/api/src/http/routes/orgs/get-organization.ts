import { auth } from '@/http/middlewares/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organizations/:slug',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Get details of an organization',
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
              organization: z.object({
                id: z.string().cuid(),
                name: z.string(),
                slug: z.string(),
                domain: z.string().nullish(),
                avatarUrl: z.string().url().nullish(),
                ownerId: z.string().cuid(),
                shouldAttachUsersByDomain: z.boolean().optional(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const { organization } = await req.getUserMemberShip(slug)

        return res.status(200).send({
          organization,
        })
      },
    )
}
