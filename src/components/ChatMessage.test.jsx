import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatMessage from "./ChatMessage";

describe("ChatMessage", () => {
  it("renders a user message with the user's content", () => {
    render(<ChatMessage message={{ role: "user", content: "Hello there" }} />);

    expect(screen.getByText("You:")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("renders an assistant message with the assistant's content", () => {
    render(<ChatMessage message={{ role: "assistant", content: "Hi!" }} />);

    expect(screen.getByText("AI:")).toBeInTheDocument();
    expect(screen.getByText("Hi!")).toBeInTheDocument();
  });

  it("shows a pending indicator for an empty assistant message", () => {
    render(<ChatMessage message={{ role: "assistant", content: "" }} />);

    expect(screen.getByText("AI:")).toBeInTheDocument();
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("renders a tool result when the message carries one", () => {
    render(
      <ChatMessage
        message={{
          role: "assistant",
          content: "",
          toolResult: {
            title: "Calculator",
            status: "success",
            detail: "42",
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Calculator" })).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});