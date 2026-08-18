import ChatMessage from "./components/ChatMessage";
import ChatSkeleton from "./components/ChatSkeleton";
import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedMessage, setFailedMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedInput = input.trim();
    setError(null);

    if (!trimmedInput || isLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedInput,
    };

    setFailedMessage(userMessage); //
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }

        throw new Error("Failed to get a response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: "" },
      ]);

      let streamCompleted = false;

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        assistantContent += decoder.decode(value, { stream: true });

        if (assistantContent.includes("[[STREAM_COMPLETE]]")) {
          streamCompleted = true;
          assistantContent = assistantContent.replace(
            "[[STREAM_COMPLETE]]",
            "",
          );
        }

        setMessages((current) => {
          const updated = [...current];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      }

      if (!streamCompleted) {
        throw new Error("The response stream ended unexpectedly.");
      }

      if (!assistantContent.trim()) {
        throw new Error("EMPTY_RESPONSE");
      }

      setFailedMessage(null);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((current) => {
        const lastMessage = current[current.length - 1];

        if (lastMessage?.role === "assistant") {
          return current.slice(0, -1);
        }

        return current;
      });

      if (error.message === "RATE_LIMIT") {
        setError(
          "The AI service is temporarily busy. Please wait a moment and try again.",
        );
      } else if (error.message === "EMPTY_RESPONSE") {
        setError(
          "The AI didn't return an answer. Please try asking your question again.",
        );
      } else {
        setError("We couldn't get a response. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRetry() {
    if (!failedMessage || isLoading) {
      return;
    }

    setError(null);
    setIsLoading(true);

    const retryMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: retryMessages,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }

        throw new Error("Failed to get a response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      let streamCompleted = false;

      setMessages((current) => [
        ...current,
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        assistantContent += decoder.decode(value, { stream: true });

        if (assistantContent.includes("[[STREAM_COMPLETE]]")) {
          streamCompleted = true;
          assistantContent = assistantContent.replace(
            "[[STREAM_COMPLETE]]",
            "",
          );
        }

        setMessages((current) => {
          const updated = [...current];

          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };

          return updated;
        });
      }

      if (!streamCompleted) {
        throw new Error("The response stream ended unexpectedly.");
      }

      if (!assistantContent.trim()) {
        throw new Error("EMPTY_RESPONSE");
      }

      setFailedMessage(null);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((current) => {
        const lastMessage = current[current.length - 1];

        if (lastMessage?.role === "assistant") {
          return current.slice(0, -1);
        }

        return current;
      });

      if (error.message === "RATE_LIMIT") {
        setError(
          "The AI service is temporarily busy. Please wait a moment and try again.",
        );
      } else if (error.message === "EMPTY_RESPONSE") {
        setError(
          "The AI didn't return an answer. Please try asking your question again.",
        );
      } else {
        setError("We couldn't get a response. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <h1>FE-09 AI Chat</h1>

      {messages.length === 0 ? (
        <section className="empty-state">
          <h2>How can I help you today?</h2>

          <p>
            Ask me anything about programming, learning, or technology.
          </p>

          <div>
            <button
              type="button"
              onClick={() => setInput("Explain React hooks")}
            >
              Explain React hooks
            </button>

            <button
              type="button"
              onClick={() => setInput("Explain JavaScript arrays")}
            >
              Explain JavaScript arrays
            </button>

            <button
              type="button"
              onClick={() => setInput("Help me debug some code")}
            >
              Help me debug some code
            </button>
          </div>
        </section>
      ) : (
        <section className="messages">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </section>
      )}

      {isLoading &&
        messages[messages.length - 1]?.role !== "assistant" && (
          <ChatSkeleton />
        )}

      {error && (
        <div role="alert">
          <strong>Something went wrong</strong>
          <p>{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={isLoading}
          >
            Try again
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask something..."
          disabled={isLoading}
        />

        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </main>
  );
}

export default App;
