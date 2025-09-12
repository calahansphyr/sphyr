import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check if login page loads
    await expect(page).toHaveTitle(/Sphyr/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate to integrations page', async ({ page }) => {
    await page.goto('/integrations');
    
    // Check if integrations page loads
    await expect(page).toHaveTitle(/Integrations/);
    
    // Check for integration elements
    await expect(page.locator('h1')).toContainText(/Integrations/);
  });

  test('should display search page', async ({ page }) => {
    await page.goto('/search');
    
    // Check if search page loads
    await expect(page).toHaveTitle(/Search/);
    
    // Check for search elements
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if dashboard page loads
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Check for dashboard elements
    await expect(page.locator('h1')).toContainText(/Dashboard/);
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Navigate to search
    await page.click('a[href="/search"]');
    await expect(page).toHaveURL(/.*search/);
    
    // Navigate to integrations
    await page.click('a[href="/integrations"]');
    await expect(page).toHaveURL(/.*integrations/);
    
    // Navigate to dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display error page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route');
    
    // Check for 404 or error page
    await expect(page.locator('h1')).toContainText(/404|Not Found|Error/);
  });
});

test.describe('API Health Check', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('checks');
  });
});

test.describe('Search API', () => {
  test('should handle search requests', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: {
        query: 'test search',
        userId: 'test-user-id',
        organizationId: 'test-org-id',
      },
    });
    
    // Should return 401 for unauthenticated requests
    expect(response.status()).toBe(401);
  });
});
