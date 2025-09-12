import { test, expect } from '@playwright/test';

/**
 * Critical User Journey E2E Test - MVP Version
 * Tests the core functionality that exists in the current MVP:
 * 1. Landing page loads
 * 2. Search page is accessible
 * 3. Search functionality works (with mocked API)
 * 4. Integrations page loads
 * This validates the MVP's core infrastructure
 */

test.describe('Critical User Journey - MVP Validation', () => {
  test('Core MVP functionality works: landing → search → integrations', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('/');
    
    // Verify the landing page loads
    await expect(page).toHaveTitle(/Sphyr/);
    await expect(page.locator('h1')).toContainText(/AI-Powered Search/);

    // Step 2: Navigate to search page
    await page.click('a[href="/search"]');
    await expect(page).toHaveURL(/.*search/);
    
    // Verify search page loads
    await expect(page.locator('h1')).toContainText(/AI-Powered Search/);
    
    // Mock search API response
    await page.route('**/api/search', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            results: [
              {
                id: '1',
                title: 'Test Document',
                content: 'This is a test document content',
                source: 'Google Drive',
                url: 'https://drive.google.com/test',
                relevanceScore: 0.95,
                createdAt: new Date().toISOString()
              },
              {
                id: '2',
                title: 'Another Document',
                content: 'Another test document with different content',
                source: 'Gmail',
                url: 'https://mail.google.com/test',
                relevanceScore: 0.87,
                createdAt: new Date().toISOString()
              }
            ],
            totalCount: 2,
            processingTime: 150
          }
        })
      });
    });
    
    // Perform search
    const searchQuery = 'test document';
    await page.fill('[data-testid="search-input"]', searchQuery);
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible({ timeout: 10000 });
    
    // Verify search results
    await expect(page.locator('[data-testid="search-result"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="search-result"]').first()).toContainText('Test Document');
    await expect(page.locator('[data-testid="search-result"]').nth(1)).toContainText('Another Document');
    
    // Verify result sources
    await expect(page.locator('[data-testid="search-result"]').first()).toContainText('Google Drive');
    await expect(page.locator('[data-testid="search-result"]').nth(1)).toContainText('Gmail');
    
    // Step 3: Navigate to integrations page
    await page.click('a[href="/integrations"]');
    await expect(page).toHaveURL(/.*integrations/);
    
    // Verify integrations page loads
    await expect(page.locator('h1')).toContainText(/Integrations/);
    
    // Step 4: Navigate to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify dashboard loads
    await expect(page.locator('h1')).toContainText(/Welcome back/);
  });

  test('Application handles errors gracefully', async ({ page }) => {
    // Test error handling for search API failure
    await page.goto('/search');
    
    // Mock search API failure
    await page.route('**/api/search', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'Search service temporarily unavailable'
        })
      });
    });
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'test query');
    await page.click('[data-testid="search-button"]');
    
    // Wait a moment for the error to be processed
    await page.waitForTimeout(2000);
    
    // Verify the search input is still accessible (basic error handling)
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });

  test('Application is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Verify the page loads on mobile
    await expect(page).toHaveTitle(/Sphyr/);
    
    // Navigate to search page
    await page.click('a[href="/search"]');
    await expect(page).toHaveURL(/.*search/);
    
    // Verify search input is usable on mobile
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    await page.fill('[data-testid="search-input"]', 'mobile test');
    
    // Verify search button is accessible
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible();
  });
});

/**
 * Helper functions for common test operations
 */
class TestHelpers {
  static async mockOAuthCallback(page: any, provider: string) {
    await page.route(`**/api/auth/${provider}/callback*`, route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard'
        }
      });
    });
  }
  
  static async mockSearchResults(page: any, results: any[]) {
    await page.route('**/api/search', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            results,
            totalCount: results.length,
            processingTime: 100
          }
        })
      });
    });
  }
  
  static async mockAPIError(page: any, endpoint: string, status: number = 500) {
    await page.route(`**/api/${endpoint}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Test error',
          message: 'This is a test error for E2E testing'
        })
      });
    });
  }
}
