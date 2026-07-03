import { test, expect } from "@playwright/test";
import { createVenueViaUI, idFromUrl, uniqueName } from "./helpers";

test.describe("Venues", () => {
  test("can create, view, edit, and delete a venue", async ({ page }) => {
    const name = uniqueName("Grand Hall");
    const venueUrl = await createVenueViaUI(page, {
      name,
      address: "42 Maple Ave, Springfield",
      capacity: "200",
      costNotes: "$3,000 flat rental fee",
    });

    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("42 Maple Ave, Springfield")).toBeVisible();
    await expect(page.getByText("200")).toBeVisible();

    // Appears in the venues list
    await page.goto("/venues");
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Edit
    await page.goto(`${venueUrl}/edit`);
    const editedName = `${name} (Renovated)`;
    await page.getByPlaceholder("e.g. The Grand Hall").fill(editedName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(venueUrl);
    await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

    // Delete
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await page.waitForURL("/venues");
    await page.goto("/venues");
    await expect(page.getByRole("link", { name: editedName })).toHaveCount(0);
  });

  test("shows the pitch, cost, and features on the detail page", async ({ page }) => {
    const name = uniqueName("Riverside Pavilion");
    const venueUrl = await createVenueViaUI(page, {
      name,
      pitch: "Stunning waterfront views and flexible indoor/outdoor flow.",
      capacity: "180",
      cost: "2500",
      features: ["Parking", "Outdoor Space"],
    });

    await page.goto(venueUrl);
    await expect(page.getByText("Stunning waterfront views and flexible indoor/outdoor flow.")).toBeVisible();
    await expect(page.getByText("$2,500")).toBeVisible();
    await expect(page.getByText("Parking", { exact: true })).toBeVisible();
    await expect(page.getByText("Outdoor Space", { exact: true })).toBeVisible();
  });

  test("favoriting a venue persists and sorts it first in the list", async ({ page }) => {
    const favoriteName = uniqueName("AAA Favorite Venue");
    const otherName = uniqueName("ZZZ Other Venue");

    const favoriteUrl = await createVenueViaUI(page, { name: favoriteName });
    await createVenueViaUI(page, { name: otherName });

    await page.goto(favoriteUrl);
    await page.getByRole("button", { name: "Add to favorites" }).click();
    await expect(page.getByRole("button", { name: "Remove from favorites" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Remove from favorites" })).toBeVisible();

    await page.goto("/venues");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.indexOf(favoriteName)).toBeLessThan(bodyText.indexOf(otherName));
  });

  test("filters venues by location, cost, capacity, and features", async ({ page }) => {
    const matchName = uniqueName("Filter Match Venue");
    const otherName = uniqueName("Filter Other Venue");
    const suffix = matchName.split(" ").pop()!;
    const location = `Springfield-${suffix}`;

    await createVenueViaUI(page, {
      name: matchName,
      address: `10 River Rd, ${location}`,
      capacity: "180",
      cost: "2500",
      features: ["Parking"],
    });
    await createVenueViaUI(page, {
      name: otherName,
      address: "500 5th Ave, Metropolis",
      capacity: "60",
      cost: "8000",
      features: ["WiFi"],
    });

    await page.goto(`/venues?location=${encodeURIComponent(location)}`);
    await expect(page.getByRole("link", { name: matchName })).toBeVisible();
    await expect(page.getByRole("link", { name: otherName })).toHaveCount(0);

    await page.goto(`/venues?maxCost=3000&location=${encodeURIComponent(location)}`);
    await expect(page.getByRole("link", { name: matchName })).toBeVisible();

    await page.goto(`/venues?minCapacity=100&location=${encodeURIComponent(location)}`);
    await expect(page.getByRole("link", { name: matchName })).toBeVisible();

    await page.goto(`/venues?features=Parking&location=${encodeURIComponent(location)}`);
    await expect(page.getByRole("link", { name: matchName })).toBeVisible();

    // Combined filters that should exclude the match
    await page.goto(`/venues?location=${encodeURIComponent(location)}&minCapacity=500`);
    await expect(page.getByText("No venues match these filters.")).toBeVisible();
  });
});

test.describe("Venues API", () => {
  test("rejects creating a venue without a name", async ({ request }) => {
    const res = await request.post("/api/venues", { data: { address: "no name here" } });
    expect(res.status()).toBe(400);
  });

  test("toggling favorite via PATCH updates isFavorite", async ({ page, request }) => {
    const name = uniqueName("PATCH Toggle Venue");
    const venueUrl = await createVenueViaUI(page, { name });
    const id = idFromUrl(venueUrl);

    const patchRes = await request.patch(`/api/venues/${id}`, {
      data: { isFavorite: true },
    });
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.isFavorite).toBe(true);
  });
});
