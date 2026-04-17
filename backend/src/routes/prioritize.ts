import { Router } from 'express'
import { z } from 'zod'
import { AppError } from '../errors.js'
import { fallbackPrioritizeTasks } from '../services/fallbackPrioritizer.js'
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
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const enableQuotaFallback = (process.env.ENABLE_QUOTA_FALLBACK ?? 'true') === 'true'

  router.post('/', async (req, res, next) => {
    try {
      const parsed = prioritizeRequestSchema.parse(req.body)
      const result = await prioritizeTasksWithGemini(parsed.tasks, geminiApiKey, modelName)
      console.log('Gemini prioritization successful')
      res.status(200).json(result)
    } catch (error) {
      console.log('Error during Gemini prioritization:', error)
      if (
        enableQuotaFallback &&
        error instanceof AppError &&
        error.code === 'AI_QUOTA_EXCEEDED'
      ) {
        const parsed = prioritizeRequestSchema.parse(req.body)
        const fallbackResult = fallbackPrioritizeTasks(parsed.tasks)
        res.setHeader('x-prioritization-mode', 'fallback')
        res.status(200).json(fallbackResult)
        return
      }

      next(error)
    }
  })

  return router
}
