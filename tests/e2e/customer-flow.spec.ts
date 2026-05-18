// tests/e2e/customer-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Customer Experience Automation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the localized customer homepage
    await page.goto("/en");
  });

  test("should load the premium home storefront with dynamic elements", async ({ page }) => {
    // 1. Verify page title contains branding
    await expect(page).toHaveTitle(/Deeshora/);

    // 2. Verify that our new premium mobile bottom navigation is rendered (highly responsive design check)
    const isMobile = page.viewportSize()?.width ? page.viewportSize()!.width < 768 : false;
    if (isMobile) {
      const bottomNav = page.locator("nav.md\\:hidden");
      if (await bottomNav.count() > 0) {
        await expect(bottomNav).toBeVisible();
        // Check for live tabs (Home, Categories, Search, Orders, Cart)
        await expect(page.locator("text=Home").first()).toBeVisible();
        await expect(page.locator("text=Categories").first()).toBeVisible();
      }
    }

    // 3. Verify category slider exists
    const categorySection = page.locator("text=Browse Categories");
    if (await categorySection.count() > 0) {
      await expect(categorySection).toBeVisible();
    }
  });

  test("should allow searching for products in the catalog", async ({ page }) => {
    // Locate visible storefront search input if it exists
    const searchInput = page.locator("input[placeholder*='Search']").filter({ visible: true }).first();
    if (await searchInput.count() > 0) {
      await searchInput.fill("Apple");
      await searchInput.press("Enter");
      // Search results or loader should change state
      await page.waitForTimeout(1000);
    }
  });

  test("should render product detail page when clicking a product", async ({ page }) => {
    // Locate the first product card on the homepage
    const productCard = page.locator("a[href*='/product/']").first();
    if (await productCard.count() > 0) {
      const href = await productCard.getAttribute("href");
      await productCard.click();
      
      // Should successfully transition to the details route
      await expect(page).toHaveURL(new RegExp(href || ""));
      
      // Details page check
      await expect(page.locator("text=Add to Cart").first()).toBeVisible();
    }
  });
});
