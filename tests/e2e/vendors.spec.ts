import { test, expect } from "./fixtures";
import { createVendorViaUI, idFromUrl, uniqueName } from "./helpers/data";

test.describe("Vendors", () => {
  test("can create, view, edit, and delete a vendor", async ({ page }) => {
    const name = uniqueName("Sunny Side Catering");
    const vendorUrl = await createVendorViaUI(page, {
      name,
      serviceType: "Catering",
      pricingNotes: "$25/person, 50 guest minimum",
    });

    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Catering", { exact: true })).toBeVisible();
    await expect(page.getByText("$25/person, 50 guest minimum")).toBeVisible();

    await page.goto("/#/vendors");
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Edit
    await page.goto(`/#/vendors/${idFromUrl(vendorUrl)}/edit`);
    const editedName = `${name} (Updated)`;
    await page.getByPlaceholder("e.g. Sunny Side Catering").fill(editedName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(new RegExp(idFromUrl(vendorUrl) + "$"));
    await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

    // Delete
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await page.waitForURL(/\/#\/vendors$/);
    await page.goto("/#/vendors");
    await expect(page.getByRole("link", { name: editedName })).toHaveCount(0);
  });
});
