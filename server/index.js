import express from "express";
import dotenv from "dotenv";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());

const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        const result = streamText({
            model: openrouter("openai/gpt-4o-mini"),
            messages,
        });

        const textStream = result.textStream;

        res.setHeader("Content-Type", "text/plain; charset=utf-8");

        for await (const chunk of textStream) {
           res.write(chunk);
        }

        res.write("[[STREAM_COMPLETE]]");
        res.end();

    } catch (error) {
        console.error("Chat error:", error);

        if (res.headersSent) {
            res.end();
            return;
        }

        res.status(500).json({
            error: "Failed to generate a response.",
        });
    }
    
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
