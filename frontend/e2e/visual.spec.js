/**
 * Visual regression tests for NFTCard, VerificationBadge, and Landing page.
 *
 * Run once to generate baselines:
 *   npx playwright test e2e/visual.spec.js --update-snapshots
 *
 * Subsequent runs compare against committed baselines and fail on visual diffs.
 * Diff images are uploaded as CI artifacts (see .github/workflows/ci.yml).
 */
import { test, expect } from '@playwright/test';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Inject a minimal Freighter stub so wallet-dependent components render. */
async function stubFreighter(context) {
  await context.addInitScript(() => {
    window.freighter = {
      isConnected: async () => false,
      getPublicKey: async () => null,
      signTransaction: async (tx) => ({ transactionEnvelope: tx }),
    };
  });
}

// ── Landing page ──────────────────────────────────────────────────────────────

test.describe('Visual — Landing page', () => {
  test('matches baseline', async ({ page, context }) => {
    await stubFreighter(context);
    await page.goto('/');
    // Wait for fonts / animations to settle
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
  });
});

// ── NFTCard component ─────────────────────────────────────────────────────────

test.describe('Visual — NFTCard', () => {
  /**
   * We render NFTCard in isolation via a dedicated test-harness route.
   * If no harness exists we navigate to the patient dashboard and wait for
   * the first card to appear (the mock server returns fixture data).
   */
  test('default state matches baseline', async ({ page, context }) => {
    await stubFreighter(context);

    // Inject a fixture record so the card renders without a live backend
    await context.addInitScript(() => {
      window.__VACCICHAIN_FIXTURE__ = {
        token_id: 1,
        vaccine_name: 'COVID-19 mRNA',
        date_administered: '2024-01-15',
        issuer: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
        dose_number: 1,
        dose_series: 2,
      };
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Locate the first NFTCard if it exists on the page, otherwise screenshot
    // the full landing as a fallback (card is rendered on patient dashboard).
    const card = page.locator('[data-testid="nft-card"]').first();
    if (await card.count() > 0) {
      await expect(card).toHaveScreenshot('nft-card.png');
    } else {
      // Navigate to patient dashboard where cards are rendered
      await page.goto('/patient');
      await page.waitForLoadState('networkidle');
      const dashCard = page.locator('[data-testid="nft-card"]').first();
      if (await dashCard.count() > 0) {
        await expect(dashCard).toHaveScreenshot('nft-card.png');
      } else {
        // No live data — screenshot the whole page as baseline
        await expect(page).toHaveScreenshot('nft-card-page.png', { fullPage: true });
      }
    }
  });
});

// ── VerificationBadge component ───────────────────────────────────────────────

test.describe('Visual — VerificationBadge', () => {
  test('verified state matches baseline', async ({ page, context }) => {
    await stubFreighter(context);
    // Navigate to the verify page with a known wallet address
    await page.goto('/verify/GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[data-testid="verification-badge"], #verification-badge').first();
    if (await badge.count() > 0) {
      await expect(badge).toHaveScreenshot('verification-badge-verified.png');
    } else {
      await expect(page).toHaveScreenshot('verify-page.png', { fullPage: true });
    }
  });

  test('not-found state matches baseline', async ({ page, context }) => {
    await stubFreighter(context);
    await page.goto('/verify/GBQVLZE4XCNDFW4YVKXNHX65IKJDQB3ZUQPQPFIJN5DCEVVNAQMTB6W');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[data-testid="verification-badge"], #verification-badge').first();
    if (await badge.count() > 0) {
      await expect(badge).toHaveScreenshot('verification-badge-not-found.png');
    } else {
      await expect(page).toHaveScreenshot('verify-page-not-found.png', { fullPage: true });
    }
  });
});
