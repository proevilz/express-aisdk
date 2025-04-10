import express from "express"
import cors from "cors"

const app = express()
const port = 3000
import { generateText, streamText } from "ai"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"

// Enable CORS for all routes to allow frontend requests
app.use(cors())
// Enable JSON body parsing for POST requests
app.use(express.json())

// Initialize the OpenRouter client with API key from environment variables
const openrouter = createOpenRouter({
	apiKey: process.env.API_KEY,
})

// Handle POST requests to the root endpoint
app.post("/", async (req, res) => {
	try {
		// Extract the prompt from the request body
		const { prompt } = req.body
		if (!prompt) {
			// Return 400 if no prompt is provided
			return res.status(400).json({ error: "Prompt is required" })
		}

		// Generate a streaming response using the AI model
		const response = await streamText({
			model: openrouter("openai/gpt-3.5-turbo"), // Use GPT-3.5-turbo model
			prompt, // The user's input prompt
		})

		// Set headers for streaming response
		res.setHeader("Content-Type", "text/plain") // Plain text content type
		res.setHeader("Transfer-Encoding", "chunked") // Enable chunked transfer encoding

		// Stream the response chunk by chunk
		for await (const chunk of response.textStream) {
			// Write each chunk to the response
			res.write(chunk)
		}
		// End the response when streaming is complete
		res.end()
	} catch (error) {
		// Log any errors that occur
		console.error("Error:", error)
		// Return a 500 error to the client
		res.status(500).json({ error: "Internal server error" })
	}
})

// Start the server on the specified port
app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
