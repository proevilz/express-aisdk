import express from "express"
import cors from "cors"

const app = express()
const port = 3000
import { generateText, streamText } from "ai"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"

// Enable CORS for all routes
app.use(cors())
app.use(express.json())

const openrouter = createOpenRouter({
	apiKey: process.env.API_KEY,
})

app.post("/", async (req, res) => {
	try {
		const { prompt } = req.body
		if (!prompt) {
			return res.status(400).json({ error: "Prompt is required" })
		}

		const response = await streamText({
			model: openrouter("openai/gpt-3.5-turbo"),
			prompt,
		})

		// Set headers for streaming
		res.setHeader("Content-Type", "text/plain")
		res.setHeader("Transfer-Encoding", "chunked")

		// Stream the response
		for await (const chunk of response.textStream) {
			res.write(chunk)
		}
		res.end()
	} catch (error) {
		console.error("Error:", error)
		res.status(500).json({ error: "Internal server error" })
	}
})

app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
