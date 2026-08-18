import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ToolResult from "./ToolResult";

describe("ToolResult", () => {
  it("renders a successful tool result with its output", () => {
    render(
      <ToolResult
        result={{ title: "Calculator", status: "success", detail: "2 + 2 = 4" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Calculator" })).toBeInTheDocument();
    expect(screen.getByText("2 + 2 = 4")).toBeInTheDocument();
  });

  it("renders a failed tool result as an error", () => {
    render(
      <ToolResult
        result={{
          title: "Web Search",
          status: "error",
          detail: "The search service is unavailable.",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Web Search" })).toBeInTheDocument();
    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("The search service is unavailable.");
  });

  it("renders a pending tool result while it is running", () => {
    render(
      <ToolResult
        result={{ title: "Image Generator", status: "loading", detail: "" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Image Generator" })).toBeInTheDocument();
    expect(screen.getByText("Running Image Generator...")).toBeInTheDocument();
  });
});