import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BadRequestError } from './routes/_errors/bad-request-error'
import { UnauthorizedError } from './routes/_errors/unauthorizad-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, req, res) => {
  if (error instanceof ZodError) {
    return res.status(400).send({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    return res.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return res.status(400).send({
      message: error.message,
    })
  }

  console.error(error)

  // send error to some observability plataform

  return res.status(500).send({
    message: 'Internal server error',
  })
}
