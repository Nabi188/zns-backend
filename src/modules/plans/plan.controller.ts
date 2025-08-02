// plan.controller.ts - Fixed version with proper error handling
import { FastifyReply, FastifyRequest } from 'fastify'
import { createPlan, getPlans } from './plan.service'
import { CreatePlanInput } from './plan.schema'
import { Prisma } from '@prisma/client'

export async function createPlanHander(
  request: FastifyRequest<{ Body: CreatePlanInput }>,
  reply: FastifyReply
) {
  const body = request.body

  try {
    const plan = await createPlan(body)
    return reply.status(201).send(plan)
  } catch (error) {
    request.log.error('Failed to create plan:', error)

    // Handle Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          // Get the field that caused the unique constraint violation
          const target = error.meta?.target as string[] | undefined
          const field = target?.[0] || 'field'

          return reply.status(409).send({
            error: 'Conflict',
            message: `A plan with this ${field} already exists`,
            code: 'DUPLICATE_ENTRY'
          })

        case 'P2000':
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'The provided value is too long for the database field',
            code: 'VALUE_TOO_LONG'
          })

        case 'P2001':
          return reply.status(404).send({
            error: 'Not Found',
            message: 'The record does not exist',
            code: 'RECORD_NOT_FOUND'
          })

        case 'P2003':
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Foreign key constraint failed',
            code: 'FOREIGN_KEY_CONSTRAINT'
          })

        case 'P2025':
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Record not found',
            code: 'RECORD_NOT_FOUND'
          })

        default:
          request.log.error('Unknown Prisma error code:', {
            code: error.code,
            message: error.message,
            meta: error.meta
          })

          return reply.status(500).send({
            error: 'Database Error',
            message: 'An unexpected database error occurred',
            code: 'DATABASE_ERROR'
          })
      }
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid data format provided',
        code: 'VALIDATION_ERROR'
      })
    }

    // Handle Prisma initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      request.log.error('Prisma initialization error:', error.message)
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_ERROR'
      })
    }

    // Handle Prisma request errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      request.log.error('Prisma panic error:', error.message)
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Database engine error',
        code: 'DATABASE_ENGINE_ERROR'
      })
    }

    // Generic server error for any other errors
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating the plan',
      code: 'INTERNAL_ERROR'
    })
  }
}

export async function getPlansHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const plans = await getPlans()
    return reply.status(200).send(plans)
  } catch (error) {
    request.log.error('Failed to get plans:', error)

    // Handle Prisma specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return reply.status(500).send({
        error: 'Database Error',
        message: 'Failed to retrieve plans from database',
        code: 'DATABASE_ERROR'
      })
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_ERROR'
      })
    }

    // Generic server error
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while retrieving plans',
      code: 'INTERNAL_ERROR'
    })
  }
}
