import { test, expect } from "@playwright/test";
import { createContactViaUI, createVendorViaUI, createVenueViaUI, uniqueName } from "./helpers";

test.describe("Contacts", () => {
  test("can create a standalone contact, edit it, and delete it", async ({ page }) => {
    const name = uniqueName("Alex Chen");
    const contactUrl = await createContactViaUI(page, {
      name,
      role: "Wedding Planner (freelance)",
      email: "alex@chenevents.com",
      phone: "(555) 222-3333",
    });

    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Wedding Planner (freelance)")).toBeVisible();
    await expect(page.getByText("alex@chenevents.com")).toBeVisible();

    await page.goto("/contacts");
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Edit
    await page.goto(`${contactUrl}/edit`);
    const editedName = `${name} Jr.`;
    await page.getByPlaceholder("e.g. Jamie Rivera").fill(editedName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(contactUrl);
    await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

    // Delete
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await page.waitForURL("/contacts");
    await page.goto("/contacts");
    await expect(page.getByRole("link", { name: editedName })).toHaveCount(0);
  });

  test("linking a contact to a venue shows up on both sides", async ({ page }) => {
    const venueName = uniqueName("Maple Grove Hall");
    const contactName = uniqueName("Jamie Rivera");

    const venueUrl = await createVenueViaUI(page, { name: venueName });
    const venueId = venueUrl.split("/").filter(Boolean).pop()!;

    await createContactViaUI(page, {
      name: contactName,
      role: "Event Coordinator",
      linkVenueId: venueId,
    });

    // Venue detail lists the contact
    await page.goto(venueUrl);
    await expect(page.getByRole("link", { name: contactName })).toBeVisible();

    // Contacts list shows the venue link
    await page.goto("/contacts");
    const row = page.locator("tr", { hasText: contactName });
    await expect(row.getByRole("link", { name: venueName })).toBeVisible();
  });

  test("linking a contact to a vendor shows up on both sides", async ({ page }) => {
    const vendorName = uniqueName("Flash Frame Photography");
    const contactName = uniqueName("Morgan Lee");

    const vendorUrl = await createVendorViaUI(page, { name: vendorName });
    const vendorId = vendorUrl.split("/").filter(Boolean).pop()!;

    await createContactViaUI(page, {
      name: contactName,
      role: "Sales Manager",
      linkVendorId: vendorId,
    });

    await page.goto(vendorUrl);
    await expect(page.getByRole("link", { name: contactName })).toBeVisible();

    await page.goto("/contacts");
    const row = page.locator("tr", { hasText: contactName });
    await expect(row.getByRole("link", { name: vendorName })).toBeVisible();
  });

  test("rejects creating a contact without a name", async ({ request }) => {
    const res = await request.post("/api/contacts", { data: { role: "no name here" } });
    expect(res.status()).toBe(400);
  });
});
