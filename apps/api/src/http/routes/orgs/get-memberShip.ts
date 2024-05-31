import { auth } from '@/http/middlewares/auth'
import { roleSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function getMemberShip(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/api/v1/organizations/:slug/member-ship',
      {
        schema: {
          tags: ['Organization'],
          summary: 'Get organization memberShip',
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
              memberShip: z.object({
                id: z.string().cuid(),
                role: roleSchema,
                organizationId: z.string().cuid(),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const { memberShip } = await req.getUserMemberShip(slug)

        return res.status(200).send({
          memberShip: {
            id: memberShip.id,
            role: memberShip.role,
            organizationId: memberShip.organizationId,
          },
        })
      },
    )
}
