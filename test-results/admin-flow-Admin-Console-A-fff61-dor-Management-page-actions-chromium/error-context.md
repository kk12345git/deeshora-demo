# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-flow.spec.ts >> Admin Console Automation Suite >> should automate Vendor Management page actions
- Location: tests\e2e\admin-flow.spec.ts:24:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Vendor Analytics').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Vendor Analytics').first()

```

```yaml
- img
- alert
```

# Test source

```ts
  1  | // tests/e2e/admin-flow.spec.ts
  2  | import { test, expect } from "@playwright/test";
  3  | 
  4  | test.describe("Admin Console Automation Suite", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Inject secure E2E bypass headers to simulate an Admin session
  7  |     await page.setExtraHTTPHeaders({
  8  |       "x-e2e-secret": "deeshora_secure_cron_9922_x",
  9  |       "x-e2e-role": "ADMIN",
  10 |     });
  11 |   });
  12 | 
  13 |   test("should successfully load Admin Dashboard with real-time operations metrics", async ({ page }) => {
  14 |     // 1. Visit the main admin console route
  15 |     await page.goto("/en/admin");
  16 |     await page.waitForLoadState("networkidle");
  17 | 
  18 |     // 2. Verify dashboard title and quick stats exist
  19 |     await expect(page.locator("text=Operational Dashboard").first()).toBeVisible();
  20 |     await expect(page.locator("text=Total Sales").first()).toBeVisible();
  21 |     await expect(page.locator("text=Active Orders").first()).toBeVisible();
  22 |   });
  23 | 
  24 |   test("should automate Vendor Management page actions", async ({ page }) => {
  25 |     // 1. Visit the vendors console page
  26 |     await page.goto("/en/admin/vendors");
  27 |     await page.waitForLoadState("networkidle");
  28 | 
  29 |     // 2. Verify vendor metrics and action tabs
> 30 |     await expect(page.locator("text=Vendor Analytics").first()).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  31 |     
  32 |     // Filter tabs should be present: ALL, PENDING, APPROVED, SUSPENDED
  33 |     const pendingTab = page.locator("button:has-text('Pending')");
  34 |     if (await pendingTab.count() > 0) {
  35 |       await pendingTab.click();
  36 |       await page.waitForTimeout(500);
  37 |     }
  38 | 
  39 |     // Search bar functionality
  40 |     const searchInput = page.locator("input[placeholder*='Search']").first();
  41 |     if (await searchInput.count() > 0) {
  42 |       await searchInput.fill("Store");
  43 |       await page.waitForTimeout(500);
  44 |     }
  45 |   });
  46 | 
  47 |   test("should load Admin Tax & GST Reconciliation center", async ({ page }) => {
  48 |     // 1. Visit the tax reconciliation center page
  49 |     await page.goto("/en/admin/tax");
  50 |     await page.waitForLoadState("networkidle");
  51 | 
  52 |     // 2. Verify tax cards and monthly calculation ledger are visible
  53 |     await expect(page.locator("text=GST").first()).toBeVisible();
  54 |     await expect(page.locator("text=Reconciliation").first()).toBeVisible();
  55 |   });
  56 | 
  57 |   test("should render Category Management settings", async ({ page }) => {
  58 |     // 1. Visit the category configuration page
  59 |     await page.goto("/en/admin/categories");
  60 |     await page.waitForLoadState("networkidle");
  61 | 
  62 |     // 2. Verify existing categories or creator panel is available
  63 |     await expect(page.locator("text=Categories").first()).toBeVisible();
  64 |   });
  65 | });
  66 | 
```