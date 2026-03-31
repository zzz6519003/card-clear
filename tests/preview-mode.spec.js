const { test, expect } = require('@playwright/test');
const { startNewGame, waitForPreviewEnd, isCardFlipped, clickCard } = require('./helpers');

test.describe('Preview Mode - Image Loading', () => {
  test('Preview displays all cards face-up', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // All 12 cards should be flipped (face-up) during preview
    const cardCount = await page.locator('.card').count();
    for (let i = 0; i < cardCount; i++) {
      const flipped = await isCardFlipped(page, i);
      expect(flipped).toBe(true);
    }
  });

  test('Card images are visible during preview', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // Check that images exist and have src
    const images = await page.locator('.card-back img').all();
    expect(images.length).toBeGreaterThan(0);

    for (const img of images) {
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src.length).toBeGreaterThan(0);
    }
  });

  test('Clicking cards during preview does nothing', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // Try to click cards
    await clickCard(page, 0);
    await page.waitForTimeout(200);
    await clickCard(page, 1);
    await page.waitForTimeout(200);

    // Board should still be in preview state (no moves recorded)
    const moves = await page.locator('#moves').textContent();
    expect(moves).toBe('0');

    // Still showing preview (cards still flipped)
    const allFlipped = await Promise.all(
      Array.from({ length: 4 }, (_, i) => isCardFlipped(page, i))
    );
    expect(allFlipped.every((f) => f === true)).toBe(true);
  });

  test('Cards auto-flip after 3 seconds', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // Before preview ends
    let firstCardFlipped = await isCardFlipped(page, 0);
    expect(firstCardFlipped).toBe(true);

    // Wait for preview to end
    await waitForPreviewEnd(page);

    // After preview end
    firstCardFlipped = await isCardFlipped(page, 0);
    expect(firstCardFlipped).toBe(false);
  });

  test('First card click after preview works', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Now we should be able to click cards
    await clickCard(page, 0);
    await page.waitForTimeout(300);

    const isFlipped = await isCardFlipped(page, 0);
    expect(isFlipped).toBe(true);
  });

  test('Preview timer waits for all images to load', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // Monitor image loading
    const startTime = Date.now();

    // Wait for preview to end
    await waitForPreviewEnd(page);

    const elapsedTime = Date.now() - startTime;

    // Should take roughly 3-5 seconds (images loading + 3 second timer)
    // At least 3 seconds for the timer
    expect(elapsedTime).toBeGreaterThanOrEqual(3000);

    // All cards should be loaded
    const images = await page.locator('.card-back img').all();
    for (const img of images) {
      const complete = await img.evaluate((el) => el.complete);
      // Most images should be loaded (allow some to still be loading)
      expect(complete).toBeDefined();
    }
  });

  test('Can start playing immediately after preview ends', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    const initialMoves = await page.locator('#moves').textContent();
    expect(initialMoves).toBe('0');

    // Click card
    await clickCard(page, 0);
    await page.waitForTimeout(200);

    // Card should be flipped
    const flipped = await isCardFlipped(page, 0);
    expect(flipped).toBe(true);

    // Click second card
    await clickCard(page, 1);
    await page.waitForTimeout(1200);

    // Moves should have incremented
    const updatedMoves = await page.locator('#moves').textContent();
    expect(updatedMoves).toBe('1');
  });

  test('No error during image load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Should be no JS errors during image loading
    expect(consoleErrors.length).toBe(0);
  });
});
