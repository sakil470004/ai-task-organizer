import dotenv from 'dotenv'

dotenv.config()

/**
 * Reads and validates environment variables at startup.
 */
export function getConfig() {
  const port = process.env.PORT ? Number(process.env.PORT) : 5000
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    throw new Error('Missing GEMINI_API_KEY in backend .env file')
  }

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT must be a valid positive number')
  }

  return {
    port,
    geminiApiKey,
  }
}
