import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorizad-error'
import { roleSchema } from '@saas/auth'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/api/v1/organization/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Create an invite',
          security: [
            {
              bearerAuth: [],
            },
          ],
          body: z.object({
            email: z.string().email(),
            role: roleSchema,
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              inviteId: z.string().cuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const { memberShip, organization } = await req.getUserMemberShip(slug)
        const userId = await req.getCurrentUserId()
        const { email, role } = req.body

        const { cannot } = getUserPermissions(userId, memberShip.role)

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError('You are not allowed to create an invite')
        }

        const [, domain] = email.split('@')

        if (
          organization.shouldAttachUsersByDomain &&
          organization.domain === domain
        ) {
          throw new BadRequestError(
            `Users with "${domain}" domain should be attached by default`,
          )
        }

        const iviteWithSameEmail = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: organization.id,
            },
          },
        })

        if (iviteWithSameEmail) {
          throw new BadRequestError('Invite with this email already exists')
        }

        const memeberWithSameEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: {
              email,
            },
          },
        })

        if (memeberWithSameEmail) {
          throw new BadRequestError('User with this email already exists')
        }

        const invite = await prisma.invite.create({
          data: {
            email,
            role,
            organizationId: organization.id,
            authorId: userId,
          },
        })

        return res.status(201).send({ inviteId: invite.id })
      },
    )
}
