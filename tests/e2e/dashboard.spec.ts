import { test, expect } from "./fixtures";
import { createContactViaUI, uniqueName } from "./helpers/data";

test.describe("Dashboard and navigation", () => {
  test("dashboard links navigate to each section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: "Contacts" }).first().click();
    await expect(page).toHaveURL(/\/#\/contacts$/);

    await page.getByRole("link", { name: "Venues" }).first().click();
    await expect(page).toHaveURL(/\/#\/venues$/);

    await page.getByRole("link", { name: "Vendors" }).first().click();
    await expect(page).toHaveURL(/\/#\/vendors$/);

    await page.getByRole("link", { name: "Dashboard" }).first().click();
    await expect(page).toHaveURL(/\/#\/$/);
  });

  test("newly created contact appears in the recently added list", async ({ page }) => {
    const name = uniqueName("Dashboard Smoke Contact");
    await createContactViaUI(page, { name, role: "Test Role" });

    await page.goto("/");
    await expect(page.getByRole("link", { name })).toBeVisible();
  });
});
