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
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-flash-latest'
  const enableQuotaFallback = (process.env.ENABLE_QUOTA_FALLBACK ?? 'true') === 'true'

  router.post('/', async (req, res, next) => {
    const requestTag = `prioritize-${Date.now()}`

    try {
      const parsed = prioritizeRequestSchema.parse(req.body)
      const totalTaskChars = parsed.tasks.reduce((sum, task) => sum + task.length, 0)

      // Logs request size details to verify exactly what is being sent to AI.
      console.log(
        `[${requestTag}] Sending prioritize request: count=${parsed.tasks.length}, totalChars=${totalTaskChars}, model=${modelName}`,
      )

      const result = await prioritizeTasksWithGemini(parsed.tasks, geminiApiKey, modelName)
      console.log(`[${requestTag}] Gemini prioritization successful`) 
      res.status(200).json(result)
    } catch (error) {
      // Logs actionable error reason for API failure diagnosis from terminal.
      if (error instanceof Error) {
        console.error(`[${requestTag}] Prioritize API failed: ${error.name}: ${error.message}`)
      } else {
        console.error(`[${requestTag}] Prioritize API failed with non-Error payload`, error)
      }

      if (
        enableQuotaFallback &&
        error instanceof AppError &&
        error.code === 'AI_QUOTA_EXCEEDED'
      ) {
        const parsed = prioritizeRequestSchema.parse(req.body)
        const fallbackResult = fallbackPrioritizeTasks(parsed.tasks)
        console.warn(`[${requestTag}] Using fallback prioritization due to AI quota limits`)
        res.setHeader('x-prioritization-mode', 'fallback')
        res.status(200).json(fallbackResult)
        return
      }

      next(error)
    }
  })

  return router
}
