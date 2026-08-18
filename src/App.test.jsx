import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import {
  createErrorResponse,
  createGatedStream,
  createResolvableGate,
  createStreamResponse,
} from "./test/helpers";

function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  return { user };
}

function mockFetch(mock) {
  vi.stubGlobal("fetch", mock);
  return mock;
}

function silenceChatErrors() {
  vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("chat form", () => {
  it("does not send a request for empty or whitespace-only input", async () => {
    const fetchMock = mockFetch(vi.fn());
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a valid submission and clears the input", async () => {
    const fetchMock = mockFetch(
      vi.fn().mockResolvedValue(createStreamResponse(["OK", "[[STREAM_COMPLETE]]"])),
    );
    const { user } = renderApp();

    const input = screen.getByRole("textbox");
    await user.type(input, "Explain React hooks");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(input).toHaveValue(""));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      messages: [{ role: "user", content: "Explain React hooks" }],
    });

    expect(screen.getByText("Explain React hooks")).toBeInTheDocument();
    await screen.findByText("OK");
  });

  it("disables the input and send button while loading", async () => {
    mockFetch(vi.fn().mockImplementation(() => new Promise(() => {})));
    const { user } = renderApp();

    const input = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: "Send" });

    await user.type(input, "Hello");
    await user.click(sendButton);

    await waitFor(() => expect(sendButton).toBeDisabled());
    expect(input).toBeDisabled();
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });
});

describe("streaming responses", () => {
  it("renders partial content while streaming and the full response at the end", async () => {
    const gate = createResolvableGate();
    const fetchMock = mockFetch(
      vi.fn().mockResolvedValue(
        createGatedStream({
          beforeFirst: "Hello",
          afterGate: " world",
          gate: gate.promise,
        }),
      ),
    );
    const { user } = renderApp();

    await user.type(screen.getByRole("textbox"), "Hi");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Hello");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    gate.release();

    await screen.findByText("Hello world");
  });
});

describe("error handling and retry", () => {
  it("shows an error and recovers when retrying after a failed request", async () => {
    silenceChatErrors();
    const fetchMock = mockFetch(
      vi
        .fn()
        .mockResolvedValueOnce(createErrorResponse(500))
        .mockResolvedValueOnce(
          createStreamResponse(["Retried answer", "[[STREAM_COMPLETE]]"]),
        ),
    );
    const { user } = renderApp();

    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't get a response. Please try again.");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await screen.findByText("Retried answer");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });

  it("shows a rate-limit message for a 429 response", async () => {
    silenceChatErrors();
    mockFetch(vi.fn().mockResolvedValue(createErrorResponse(429)));
    const { user } = renderApp();

    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "The AI service is temporarily busy. Please wait a moment and try again.",
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("shows a message when the AI returns an empty response", async () => {
    silenceChatErrors();
    mockFetch(vi.fn().mockResolvedValue(createStreamResponse(["[[STREAM_COMPLETE]]"])));
    const { user } = renderApp();

    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "The AI didn't return an answer. Please try asking your question again.",
    );
  });

  it("removes a partial assistant message when the stream ends unexpectedly", async () => {
    silenceChatErrors();
    mockFetch(vi.fn().mockResolvedValue(createStreamResponse(["Partial answer"])));
    const { user } = renderApp();

    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't get a response. Please try again.");

    expect(screen.queryByText("Partial answer")).not.toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});