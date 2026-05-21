// tests/e2e/wallet-points.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Wallet Welcome Offer & Redeem Points E2E Flow", () => {
  test.beforeEach(async ({ context, page }) => {
    // 1. Inject cookies for client-side Clerk layout bypass
    await context.addCookies([
      {
        name: "x-e2e-secret",
        value: "deeshora_secure_cron_9922_x",
        domain: "127.0.0.1",
        path: "/",
      },
      {
        name: "x-e2e-role",
        value: "CUSTOMER",
        domain: "127.0.0.1",
        path: "/",
      },
      {
        name: "x-e2e-secret",
        value: "deeshora_secure_cron_9922_x",
        domain: "localhost",
        path: "/",
      },
      {
        name: "x-e2e-role",
        value: "CUSTOMER",
        domain: "localhost",
        path: "/",
      },
    ]);

    // 2. Inject secure E2E bypass headers to simulate a CUSTOMER session for server-side page renders
    await page.setExtraHTTPHeaders({
      "x-e2e-secret": "deeshora_secure_cron_9922_x",
      "x-e2e-role": "CUSTOMER",
    });
  });

  test("should load customer wallet page and display points status", async ({ page }) => {
    // 1. Navigate to wallet page
    await page.goto("/en/wallet");
    await page.waitForLoadState("networkidle");

    // 2. Verify wallet UI elements
    await expect(page.locator("text=Total Value").first()).toBeVisible();
    await expect(page.locator("text=Redeemable Points").first()).toBeVisible();
    await expect(page.locator("text=Redeem Now").first()).toBeVisible();

    // 3. Verify either welcome offer active or welcome offer claimed banner is visible
    const welcomeActive = page.locator("text=Welcome Offer Active");
    const welcomeClaimed = page.locator("text=Welcome Offer Claimed");
    
    const isActiveVisible = await welcomeActive.count() > 0;
    const isClaimedVisible = await welcomeClaimed.count() > 0;
    
    expect(isActiveVisible || isClaimedVisible).toBe(true);
  });

  test("should load the premium points redemption page and view history ledger", async ({ page }) => {
    // 1. Navigate directly to the redeem page
    await page.goto("/en/wallet/redeem");
    await page.waitForLoadState("networkidle");

    // 2. Verify header titles
    await expect(page.locator("text=REDEEM POINTS").first()).toBeVisible();
    await expect(page.locator("text=Convert product reward points into spendable wallet balance").first()).toBeVisible();

    // 3. Verify Points Converter card elements
    await expect(page.locator("text=CONVERT POINTS").first()).toBeVisible();
    await expect(page.locator("text=Total wallet cash to receive").first()).toBeVisible();
    await expect(page.locator("text=Convert All Points").first()).toBeVisible();

    // 4. Verify ledger list container is rendered
    await expect(page.locator("text=LEDGER").first()).toBeVisible();
    await expect(page.locator("text=Points History").first()).toBeVisible();
  });
});
