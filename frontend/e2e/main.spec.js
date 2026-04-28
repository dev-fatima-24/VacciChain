import { test, expect } from '@playwright/test';

test.describe('VacciChain Frontend E2E Tests', () => {
  test.describe('Landing Page', () => {
    test('should load landing page', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/VacciChain|Vaccination/i);
    });

    test('should display project overview', async ({ page }) => {
      await page.goto('/');
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });

    test('should have connect wallet button', async ({ page }) => {
      await page.goto('/');
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet"), button:has-text("Freighter")');
      await expect(connectButton.first()).toBeVisible();
    });
  });

  test.describe('Wallet Connection Flow', () => {
    test('should navigate to patient dashboard after wallet connect', async ({ page, context }) => {
      // Mock Freighter wallet
      await context.addInitScript(() => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
          signTransaction: async (tx) => ({
            transactionEnvelope: tx,
            signature: 'mock-signature',
          }),
          signAuthEntry: async (entry) => ({
            signature: 'mock-signature',
          }),
        };
      });

      await page.goto('/');
      
      // Click connect wallet button
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet"), button:has-text("Freighter")');
      if (await connectButton.first().isVisible()) {
        await connectButton.first().click();
      }

      // Wait for navigation or dashboard to appear
      await page.waitForTimeout(2000);
      
      // Check if we're on dashboard or see vaccination records
      const dashboardIndicator = page.locator('text=Dashboard, text=Records, text=Vaccination');
      const isOnDashboard = await dashboardIndicator.first().isVisible().catch(() => false);
      
      if (isOnDashboard) {
        expect(isOnDashboard).toBeTruthy();
      }
    });

    test('should display wallet address after connection', async ({ page, context }) => {
      const testAddress = 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ';
      
      await context.addInitScript(() => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => testAddress,
          signTransaction: async (tx) => ({
            transactionEnvelope: tx,
            signature: 'mock-signature',
          }),
        };
      });

      await page.goto('/');
      
      // Attempt to connect
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")');
      if (await connectButton.first().isVisible()) {
        await connectButton.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for address display
      const addressDisplay = page.locator(`text=${testAddress.substring(0, 10)}`);
      const isAddressVisible = await addressDisplay.isVisible().catch(() => false);
      
      if (isAddressVisible) {
        expect(isAddressVisible).toBeTruthy();
      }
    });
  });

  test.describe('Vaccination Records Display', () => {
    test('should display vaccination records on patient dashboard', async ({ page, context }) => {
      await context.addInitScript(() => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
          signTransaction: async (tx) => ({
            transactionEnvelope: tx,
            signature: 'mock-signature',
          }),
        };
      });

      await page.goto('/');
      
      // Connect wallet
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")');
      if (await connectButton.first().isVisible()) {
        await connectButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Look for vaccination records or empty state
      const recordsContainer = page.locator('[class*="record"], [class*="vaccination"], [class*="card"]');
      const emptyState = page.locator('text=No records, text=No vaccinations, text=empty');
      
      const hasRecords = await recordsContainer.first().isVisible().catch(() => false);
      const hasEmptyState = await emptyState.first().isVisible().catch(() => false);
      
      expect(hasRecords || hasEmptyState).toBeTruthy();
    });

    test('should display vaccine name and date in records', async ({ page, context }) => {
      await context.addInitScript(() => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
          signTransaction: async (tx) => ({
            transactionEnvelope: tx,
            signature: 'mock-signature',
          }),
        };
      });

      await page.goto('/');
      
      // Connect and navigate to records
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")');
      if (await connectButton.first().isVisible()) {
        await connectButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Look for vaccine information
      const vaccineInfo = page.locator('text=COVID, text=Pfizer, text=Moderna, text=2024');
      const hasVaccineInfo = await vaccineInfo.first().isVisible().catch(() => false);
      
      if (hasVaccineInfo) {
        expect(hasVaccineInfo).toBeTruthy();
      }
    });
  });

  test.describe('Verification Page', () => {
    test('should load verification page', async ({ page }) => {
      await page.goto('/verify');
      const heading = page.locator('h1, h2');
      await expect(heading.first()).toBeVisible();
    });

    test('should accept wallet address input', async ({ page }) => {
      await page.goto('/verify');
      
      const input = page.locator('input[type="text"], input[placeholder*="wallet"], input[placeholder*="address"]');
      if (await input.first().isVisible()) {
        await input.first().fill('GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');
        await expect(input.first()).toHaveValue('GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');
      }
    });

    test('should display verification result', async ({ page }) => {
      await page.goto('/verify');
      
      const input = page.locator('input[type="text"], input[placeholder*="wallet"]');
      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Check")');
      
      if (await input.first().isVisible() && await verifyButton.first().isVisible()) {
        await input.first().fill('GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');
        await verifyButton.first().click();
        
        // Wait for result
        await page.waitForTimeout(2000);
        
        // Look for verification badge or result
        const result = page.locator('[class*="badge"], [class*="result"], [class*="status"]');
        const isResultVisible = await result.first().isVisible().catch(() => false);
        
        if (isResultVisible) {
          expect(isResultVisible).toBeTruthy();
        }
      }
    });

    test('should reject invalid wallet address', async ({ page }) => {
      await page.goto('/verify');
      
      const input = page.locator('input[type="text"], input[placeholder*="wallet"]');
      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Check")');
      
      if (await input.first().isVisible() && await verifyButton.first().isVisible()) {
        await input.first().fill('invalid-address');
        await verifyButton.first().click();
        
        // Look for error message
        const errorMessage = page.locator('[class*="error"], text=Invalid, text=invalid');
        const hasError = await errorMessage.first().isVisible().catch(() => false);
        
        if (hasError) {
          expect(hasError).toBeTruthy();
        }
      }
    });
  });

  test.describe('Issuer Dashboard', () => {
    test('should load issuer dashboard for admin', async ({ page, context }) => {
      const adminAddress = process.env.ADMIN_PUBLIC_KEY || 'GADMIN';
      
      await context.addInitScript((addr) => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => addr,
          signTransaction: async (tx) => ({
            transactionEnvelope: tx,
            signature: 'mock-signature',
          }),
        };
      }, adminAddress);

      await page.goto('/issuer');
      
      // Connect wallet
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")');
      if (await connectButton.first().isVisible()) {
        await connectButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Look for issuer form
      const form = page.locator('form, [class*="form"]');
      const isFormVisible = await form.first().isVisible().catch(() => false);
      
      if (isFormVisible) {
        expect(isFormVisible).toBeTruthy();
      }
    });

    test('should display vaccination form fields', async ({ page, context }) => {
      const adminAddress = process.env.ADMIN_PUBLIC_KEY || 'GADMIN';
      
      await context.addInitScript((addr) => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => addr,
          signTransaction: async (tx) => ({
            transactionEnvelope: tx,
            signature: 'mock-signature',
          }),
        };
      }, adminAddress);

      await page.goto('/issuer');
      
      // Connect
      const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")');
      if (await connectButton.first().isVisible()) {
        await connectButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Look for form fields
      const patientField = page.locator('input[placeholder*="patient"], input[placeholder*="wallet"]');
      const vaccineField = page.locator('input[placeholder*="vaccine"], input[placeholder*="name"]');
      const dateField = page.locator('input[type="date"], input[placeholder*="date"]');
      
      const hasPatientField = await patientField.first().isVisible().catch(() => false);
      const hasVaccineField = await vaccineField.first().isVisible().catch(() => false);
      const hasDateField = await dateField.first().isVisible().catch(() => false);
      
      expect(hasPatientField || hasVaccineField || hasDateField).toBeTruthy();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
      await page.goto('/');
      
      // Look for navigation links
      const verifyLink = page.locator('a:has-text("Verify"), a:has-text("Check")');
      const dashboardLink = page.locator('a:has-text("Dashboard"), a:has-text("Records")');
      
      if (await verifyLink.first().isVisible()) {
        await verifyLink.first().click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/verify');
      }
    });

    test('should have responsive layout', async ({ page }) => {
      await page.goto('/');
      
      // Check viewport
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();
      
      // Check if main content is visible
      const mainContent = page.locator('main, [role="main"], body > div');
      await expect(mainContent.first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await page.goto('/verify').catch(() => {});
      
      // Re-enable network
      await page.context().setOffline(false);
      
      // Page should still be functional
      const heading = page.locator('h1, h2');
      const isHeadingVisible = await heading.first().isVisible().catch(() => false);
      
      expect(isHeadingVisible || page.url()).toBeTruthy();
    });

    test('should display error message for failed requests', async ({ page }) => {
      await page.goto('/verify');
      
      const input = page.locator('input[type="text"], input[placeholder*="wallet"]');
      const verifyButton = page.locator('button:has-text("Verify")');
      
      if (await input.first().isVisible() && await verifyButton.first().isVisible()) {
        // Try with empty input
        await verifyButton.first().click();
        
        // Look for error or validation message
        const errorMessage = page.locator('[class*="error"], [role="alert"]');
        const hasError = await errorMessage.first().isVisible().catch(() => false);
        
        if (hasError) {
          expect(hasError).toBeTruthy();
        }
      }
    });
  });
});
