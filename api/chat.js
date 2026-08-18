import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    const result = streamText({
      model: openrouter("openai/gpt-4o-mini"),
      messages,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    for await (const chunk of result.textStream) {
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
}