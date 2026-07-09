import type { Page } from "@playwright/test";

/**
 * Generates a name unique to this test run so tests never collide with
 * leftover data or with each other, even across repeated local runs.
 */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function createVenueViaUI(
  page: Page,
  options: {
    name: string;
    address?: string;
    pitch?: string;
    capacity?: string;
    cost?: string;
    costNotes?: string;
    features?: string[];
    notes?: string;
  }
): Promise<string> {
  await page.goto("/#/venues/new");
  await page.getByPlaceholder("e.g. The Grand Hall").fill(options.name);
  if (options.address) {
    await page.getByPlaceholder("123 Main St, Springfield").fill(options.address);
  }
  if (options.pitch) {
    await page.getByPlaceholder("What makes this venue stand out for events...").fill(options.pitch);
  }
  if (options.capacity) {
    await page.getByPlaceholder("150").fill(options.capacity);
  }
  if (options.cost) {
    await page.getByPlaceholder("3000").fill(options.cost);
  }
  if (options.costNotes) {
    await page.getByPlaceholder("$2,500 flat rental fee, $500 deposit...").fill(options.costNotes);
  }
  for (const feature of options.features ?? []) {
    await page.locator(`label:has-text("${feature}") input[type="checkbox"]`).check();
  }
  if (options.notes) {
    await page.getByPlaceholder("Parking available, must book 60 days in advance...").fill(options.notes);
  }
  await page.getByRole("button", { name: "Create venue" }).click();
  await page.waitForURL(/\/venues\/(?!new)[^/]+$/);
  return page.url();
}

export async function createVendorViaUI(
  page: Page,
  options: {
    name: string;
    serviceType?: string;
    pricingNotes?: string;
    notes?: string;
  }
): Promise<string> {
  await page.goto("/#/vendors/new");
  await page.getByPlaceholder("e.g. Sunny Side Catering").fill(options.name);
  if (options.serviceType) {
    await page.getByPlaceholder("Catering, Photography, Decor...").fill(options.serviceType);
  }
  if (options.pricingNotes) {
    await page.getByPlaceholder("$25/person, minimum 50 guests...").fill(options.pricingNotes);
  }
  if (options.notes) {
    await page.getByPlaceholder("Requires 2 week lead time, vegan options available...").fill(options.notes);
  }
  await page.getByRole("button", { name: "Create vendor" }).click();
  await page.waitForURL(/\/vendors\/(?!new)[^/]+$/);
  return page.url();
}

export async function createContactViaUI(
  page: Page,
  options: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    notes?: string;
    linkVenueId?: string;
    linkVendorId?: string;
  }
): Promise<string> {
  const query = options.linkVenueId
    ? `?venueId=${options.linkVenueId}`
    : options.linkVendorId
    ? `?vendorId=${options.linkVendorId}`
    : "";
  await page.goto(`/#/contacts/new${query}`);
  await page.getByPlaceholder("e.g. Jamie Rivera").fill(options.name);
  if (options.role) {
    await page.getByPlaceholder("Event coordinator, Sales manager...").fill(options.role);
  }
  if (options.email) {
    await page.getByPlaceholder("jamie@example.com").fill(options.email);
  }
  if (options.phone) {
    await page.getByPlaceholder("(555) 123-4567").fill(options.phone);
  }
  if (options.notes) {
    await page.getByPlaceholder("Best reached by text, prefers afternoon calls...").fill(options.notes);
  }
  await page.getByRole("button", { name: "Create contact" }).click();
  await page.waitForURL(/\/contacts\/(?!new)[^/]+$/);
  return page.url();
}

export function idFromUrl(url: string): string {
  return url.split("/").filter(Boolean).pop() as string;
}
