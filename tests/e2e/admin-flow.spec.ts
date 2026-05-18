// tests/e2e/admin-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Admin Console Automation Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Inject secure E2E bypass headers to simulate an Admin session
    await page.setExtraHTTPHeaders({
      "x-e2e-secret": "deeshora_secure_cron_9922_x",
      "x-e2e-role": "ADMIN",
    });
  });

  test("should successfully load Admin Dashboard with real-time operations metrics", async ({ page }) => {
    // 1. Visit the main admin console route
    await page.goto("/en/admin");
    await page.waitForLoadState("networkidle");

    // 2. Verify dashboard title and quick stats exist
    await expect(page.locator("text=Operational Dashboard").first()).toBeVisible();
    await expect(page.locator("text=Total Sales").first()).toBeVisible();
    await expect(page.locator("text=Active Orders").first()).toBeVisible();
  });

  test("should automate Vendor Management page actions", async ({ page }) => {
    // 1. Visit the vendors console page
    await page.goto("/en/admin/vendors");
    await page.waitForLoadState("networkidle");

    // 2. Verify vendor metrics and action tabs
    await expect(page.locator("text=Vendor Analytics").first()).toBeVisible();
    
    // Filter tabs should be present: ALL, PENDING, APPROVED, SUSPENDED
    const pendingTab = page.locator("button:has-text('Pending')");
    if (await pendingTab.count() > 0) {
      await pendingTab.click();
      await page.waitForTimeout(500);
    }

    // Search bar functionality
    const searchInput = page.locator("input[placeholder*='Search']").first();
    if (await searchInput.count() > 0) {
      await searchInput.fill("Store");
      await page.waitForTimeout(500);
    }
  });

  test("should load Admin Tax & GST Reconciliation center", async ({ page }) => {
    // 1. Visit the tax reconciliation center page
    await page.goto("/en/admin/tax");
    await page.waitForLoadState("networkidle");

    // 2. Verify tax cards and monthly calculation ledger are visible
    await expect(page.locator("text=GST").first()).toBeVisible();
    await expect(page.locator("text=Reconciliation").first()).toBeVisible();
  });

  test("should render Category Management settings", async ({ page }) => {
    // 1. Visit the category configuration page
    await page.goto("/en/admin/categories");
    await page.waitForLoadState("networkidle");

    // 2. Verify existing categories or creator panel is available
    await expect(page.locator("text=Categories").first()).toBeVisible();
  });
});
