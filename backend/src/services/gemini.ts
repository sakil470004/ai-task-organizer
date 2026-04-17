import type { PrioritizedTask } from '../types.js'
import { AppError } from '../errors.js'
import { parseAndValidateAiResponse } from '../utils/parseAiJson.js'

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

interface GeminiErrorResponse {
  error?: {
    code?: number
    message?: string
    status?: string
    details?: Array<{
      '@type'?: string
      retryDelay?: string
    }>
  }
}

/**
 * Calls Gemini with a strict JSON prompt and returns normalized prioritized tasks.
 */
export async function prioritizeTasksWithGemini(
  tasks: string[],
  apiKey: string,
  modelName: string,
): Promise<PrioritizedTask[]> {
  const prompt = buildPrompt(tasks)

  const text = await requestGeminiText(prompt, apiKey, modelName)

  if (!text) {
    throw new Error('Gemini response did not include text output')
  }

  return parseAndValidateAiResponse(text)
}

/**
 * Calls Gemini and retries once when provider returns explicit retry hints.
 */
async function requestGeminiText(
  prompt: string,
  apiKey: string,
  modelName: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (response.ok) {
      const data = (await response.json()) as GeminiApiResponse
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new AppError('Gemini response did not include text output', 502, 'AI_BAD_RESPONSE')
      }

      return text
    }

    const errorJson = (await response.json().catch(() => null)) as GeminiErrorResponse | null
    const retryDelayMs = extractRetryDelayMs(errorJson)
    const status = errorJson?.error?.status ?? ''

    if (
      response.status === 429 &&
      (status === 'RESOURCE_EXHAUSTED' || status === 'UNAVAILABLE') &&
      attempt === 1 &&
      retryDelayMs > 0
    ) {
      await delay(retryDelayMs)
      continue
    }

    if (response.status === 429) {
      throw new AppError(
        'Gemini quota/rate limit reached. Please retry shortly or enable billing in Google AI Studio.',
        429,
        'AI_QUOTA_EXCEEDED',
      )
    }

    throw new AppError(
      `Gemini request failed with status ${response.status}.`,
      502,
      'AI_PROVIDER_ERROR',
    )
  }

  throw new AppError('Gemini request retries exhausted.', 429, 'AI_QUOTA_EXCEEDED')
}

function extractRetryDelayMs(errorJson: GeminiErrorResponse | null): number {
  const details = errorJson?.error?.details
  if (!Array.isArray(details)) {
    return 0
  }

  const retryDetail = details.find((detail) => detail['@type']?.includes('RetryInfo'))
  const delay = retryDetail?.retryDelay
  if (!delay) {
    return 0
  }

  const match = delay.match(/(\d+(?:\.\d+)?)s/)
  if (!match) {
    return 0
  }

  return Math.max(0, Math.round(Number(match[1]) * 1000))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Creates a deterministic prompt to return JSON array only.
 */
function buildPrompt(tasks: string[]): string {
  return [
    'You are a task prioritization expert.',
    'Analyze the list of tasks and return only a JSON array with no markdown or explanation.',
    "Each object must contain exactly these keys: task, priority, category.",
    "priority must be one of: High, Medium, Low.",
    'category must be a short one-word label (for example: Work, Home, Personal).',
    'Keep the original task text unchanged.',
    'Sort the array from highest priority to lowest priority.',
    'Tasks:',
    JSON.stringify(tasks),
  ].join('\n')
}
