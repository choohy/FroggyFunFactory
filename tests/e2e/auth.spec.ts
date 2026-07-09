import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./helpers/emulatorAuth";

test.describe("Authentication and permissions", () => {
  test("signed-out visitors see the page shell but not data", async ({ page }) => {
    await page.goto("/#/venues");
    await expect(page.getByRole("heading", { name: "Venues" })).toBeVisible();
    await expect(page.getByText("Sign in with Google to view and manage this data.")).toBeVisible();
  });

  test("a signed-in but non-allowlisted user is denied", async ({ page }) => {
    await page.goto("/#/venues");
    await signInAsTestUser(page, "not-allowed@example.com");
    await expect(page.getByText("not-allowed@example.com").first()).toBeVisible();
    await expect(page.getByText("isn’t authorized to view this data")).toBeVisible();
  });

  test("an allowlisted user can see and create data", async ({ page }) => {
    await page.goto("/#/venues");
    await signInAsTestUser(page, "allowed-test-user@example.com");
    await expect(page.getByText("allowed-test-user@example.com")).toBeVisible();
    await expect(page.getByRole("link", { name: "+ Add Venue" })).toBeVisible();
  });
});
