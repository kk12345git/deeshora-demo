// tests/e2e/admin-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Admin Console Automation Suite", () => {
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
        value: "ADMIN",
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
        value: "ADMIN",
        domain: "localhost",
        path: "/",
      },
    ]);

    // 2. Inject secure E2E bypass headers to simulate an Admin session for server-side page renders
    await page.setExtraHTTPHeaders({
      "x-e2e-secret": "deeshora_secure_cron_9922_x",
      "x-e2e-role": "ADMIN",
    });
  });

  test("should successfully load Admin Dashboard with real-time operations metrics", async ({ page }) => {
    // 1. Visit the main admin console route
    await page.goto("/en/admin");
    await page.waitForLoadState("networkidle");

    // 2. Verify dashboard title and live stats exist
    await expect(page.locator("text=Command Center").first()).toBeVisible();
    await expect(page.locator("text=Total Users").first()).toBeVisible();
    await expect(page.locator("text=Orders Today").first()).toBeVisible();
  });

  test("should automate Vendor Management page actions", async ({ page }) => {
    // 1. Visit the vendors console page
    await page.goto("/en/admin/vendors");
    await page.waitForLoadState("networkidle");

    // 2. Verify vendor metrics and action tabs
    await expect(page.locator("text=Marketplace Vendors").first()).toBeVisible();
    
    // Filter tabs should be present: ALL, PENDING, APPROVED, SUSPENDED
    const pendingTab = page.locator("button:has-text('Pending')");
    if (await pendingTab.count() > 0) {
      await pendingTab.click();
      await page.waitForTimeout(500);
    }

    // Search bar functionality
    const searchInput = page.locator("input[placeholder*='SEARCH']").first();
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
    await expect(page.locator("text=Tax Control").first()).toBeVisible();
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
