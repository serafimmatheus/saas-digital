import fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createAccount } from './routes/auth/create-account'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { getProfile } from './routes/auth/get-profile'
import { errorHandler } from './error-handler'
import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { resetPassword } from './routes/auth/reset-password'
import { authenticateWithGitHub } from './routes/auth/authenticate-with-github'
import { env } from '@saas/env'
import { createOrganization } from './routes/orgs/create-organization'
import { getMemberShip } from './routes/orgs/get-memberShip'
import { getOrganization } from './routes/orgs/get-organization'
import { getOrganizations } from './routes/orgs/get-organizations'
import { updateOrganization } from './routes/orgs/update-organization'
import { shutdownOrganization } from './routes/orgs/shutdown-organization'
import { transferOrganization } from './routes/orgs/transfer-organization'
import { createProject } from './routes/projects/create-project'
import { deleteProject } from './routes/projects/delete-project'
import { getProject } from './routes/projects/get-project'
import { getProjects } from './routes/projects/get-projects'
import { updateProject } from './routes/projects/update-project'
import { getMembers } from './routes/members/get-members'
import { updateMembers } from './routes/members/update-members'
import { removeMembers } from './routes/members/remove-member'
import { createInvite } from './routes/invites/create-invite'
import { getInvite } from './routes/invites/get-invite'
import { getInvites } from './routes/invites/get-invites'
import { acceptInvite } from './routes/invites/accept-invite'
import { rejectInvite } from './routes/invites/reject-invite'
import { revokeInvite } from './routes/invites/revoke-invite'
import { getPendingInvite } from './routes/invites/get-pending-invites'
import { getOrganizationBilling } from './routes/billing/get-organization.billing'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Saas Digital',
      description: 'API Documentation',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },

  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors)

// auth routes
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(authenticateWithGitHub)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)

// Organization routes
app.register(createOrganization)
app.register(getMemberShip)
app.register(getOrganization)
app.register(getOrganizations)
app.register(updateOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)

// Project routes
app.register(createProject)
app.register(deleteProject)
app.register(getProject)
app.register(getProjects)
app.register(updateProject)

// Members routes
app.register(getMembers)
app.register(updateMembers)
app.register(removeMembers)

// Invites routes
app.register(createInvite)
app.register(getInvite)
app.register(getInvites)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(revokeInvite)
app.register(getPendingInvite)

// Billing routes
app.register(getOrganizationBilling)

// Start the server
app
  .listen({
    port: env.SERVER_PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`Server is running on http://localhost:${env.SERVER_PORT}`)
  })
  .catch((err) => {
    console.error(err)
  })
