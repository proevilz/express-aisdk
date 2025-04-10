import { useState } from "react"
import "./App.css"

interface Message {
	role: "user" | "assistant"
	content: string
}

export default function Page() {
	const [input, setInput] = useState("")
	const [messages, setMessages] = useState<Message[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return

		// Add user message to history
		const userMessage: Message = { role: "user", content: input }
		setMessages((prev) => [...prev, userMessage])
		setInput("") // Clear input immediately

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch("http://localhost:3000/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ prompt: input }),
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error("No reader available")
			}

			const decoder = new TextDecoder()
			let result = ""

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const chunk = decoder.decode(value)
				result += chunk
				// Update the last message (AI response) with the new content
				setMessages((prev) => {
					const newMessages = [...prev]
					const lastMessage = newMessages[newMessages.length - 1]
					if (lastMessage?.role === "assistant") {
						lastMessage.content = result
					} else {
						newMessages.push({ role: "assistant", content: result })
					}
					return newMessages
				})
			}
		} catch (err) {
			setError(err instanceof Error ? err : new Error("An unknown error occurred"))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="chat-container">
			<div className="chat-header">
				<h1>AI Chat</h1>
			</div>
			<div className="chat-messages">
				{messages.map((message, index) => (
					<div
						key={index}
						className={`message ${message.role === "user" ? "user-message" : "ai-message"}`}
					>
						{message.content}
					</div>
				))}
				{isLoading && <div className="message ai-message">Thinking...</div>}
				{error && <div className="message error-message">Error: {error.message}</div>}
			</div>
			<form onSubmit={handleSubmit} className="chat-input-form">
				<input
					name="prompt"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					className="chat-input"
					disabled={isLoading}
				/>
				<button type="submit" className="send-button" disabled={isLoading}>
					{isLoading ? "Sending..." : "Send"}
				</button>
			</form>
		</div>
	)
}
