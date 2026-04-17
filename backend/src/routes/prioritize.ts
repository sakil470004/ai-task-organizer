import { Router } from 'express'
import { z } from 'zod'
import { prioritizeTasksWithGemini } from '../services/gemini.js'

const prioritizeRequestSchema = z.object({
  tasks: z
    .array(z.string().trim().min(1, 'Task cannot be empty'))
    .min(1, 'At least one task is required')
    .max(100, 'Too many tasks submitted at once'),
})

/**
 * Creates prioritize route and wires it to Gemini service.
 */
export function buildPrioritizeRouter(geminiApiKey: string): Router {
  const router = Router()

  router.post('/', async (req, res, next) => {
    try {
      const parsed = prioritizeRequestSchema.parse(req.body)
      const result = await prioritizeTasksWithGemini(parsed.tasks, geminiApiKey)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}
