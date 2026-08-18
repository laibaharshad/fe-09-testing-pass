import { expect, test } from "@playwright/test";

test("primary chat flow with a mocked assistant response", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: "This is a mocked AI response. [[STREAM_COMPLETE]]",
    }),
  );

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "How can I help you today?" }),
  ).toBeVisible();

  const input = page.getByRole("textbox");
  await input.fill("Hello from Playwright");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("You:", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Hello from Playwright", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText("This is a mocked AI response.", { exact: true }),
  ).toBeVisible();

  await expect(input).toHaveValue("");
});