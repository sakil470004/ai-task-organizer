import cors from 'cors'
import express from 'express'
import { getConfig } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'
import { buildPrioritizeRouter } from './routes/prioritize.js'

const { port, geminiApiKey } = getConfig()
const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.use('/prioritize', buildPrioritizeRouter(geminiApiKey))

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`)
})
