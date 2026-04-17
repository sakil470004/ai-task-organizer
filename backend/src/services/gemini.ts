import type { PrioritizedTask } from '../types.js'
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

/**
 * Calls Gemini with a strict JSON prompt and returns normalized prioritized tasks.
 */
export async function prioritizeTasksWithGemini(
  tasks: string[],
  apiKey: string,
): Promise<PrioritizedTask[]> {
  const prompt = buildPrompt(tasks)

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
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
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`)
  }

  const data = (await response.json()) as GeminiApiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini response did not include text output')
  }

  return parseAndValidateAiResponse(text)
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
