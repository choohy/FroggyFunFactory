import { test as base, expect } from "@playwright/test";
import { signInAsTestUser } from "./helpers/emulatorAuth";

export const TEST_USER_EMAIL = "allowed-test-user@example.com";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/");
    await signInAsTestUser(page, TEST_USER_EMAIL);
    await expect(page.getByText(TEST_USER_EMAIL)).toBeVisible();
    await use(page);
  },
});

export { expect };
