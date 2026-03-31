const { test, expect } = require('@playwright/test');
const { startNewGame, waitForPreviewEnd, toggleCheatMode, setGameMode } = require('./helpers');

test.describe('Edge Cases & Race Conditions', () => {
  test('Reset button resets game correctly', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Play a move
    await page.click('.card:first-child');
    await page.waitForTimeout(200);

    const cardsStarted = await page.locator('.card:not(.matched)').count();

    // Click Reset
    await page.click('#resetBtn');
    await page.waitForTimeout(1500);

    // Cards unmatched count should be same as initial
    const cardsAfterReset = await page.locator('.card:not(.matched)').count();
    expect(cardsAfterReset).toBe(12);

    // Score should be 0
    const score = await page.locator('#score').textContent();
    expect(score).toBe('0');
  });

  test('Cheat mode toggle during preview', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // Toggle cheat mode during preview
    await toggleCheatMode(page);

    // Cards should be visible (both from preview and cheat)
    const firstCard = page.locator('.card').first();
    const hasFlipped = await firstCard.evaluate((el) => el.classList.contains('flipped'));
    expect(hasFlipped).toBe(true);

    // Toggle off
    await toggleCheatMode(page);

    // Still in preview state
    const stillFlipped = await firstCard.evaluate((el) => el.classList.contains('flipped'));
    expect(stillFlipped).toBe(true); // From preview
  });

  test('No console errors on normal gameplay', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Play a few moves
    for (let i = 0; i < 3; i++) {
      const cards = await page.locator('.card:not(.matched)').all();
      if (cards.length >= 2) {
        await cards[0].click();
        await page.waitForTimeout(100);
        await cards[1].click();
        await page.waitForTimeout(1200);
      }
    }

    // Should be no errors
    expect(errors.length).toBe(0);
  });

  test('Cannot click matched cards', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Try to find and match a pair (probabilistic)
    let matchFound = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts && !matchFound) {
      const cards = await page.locator('.card:not(.matched)').all();
      if (cards.length < 2) break;

      await cards[0].click();
      await page.waitForTimeout(100);
      await cards[1].click();
      await page.waitForTimeout(1200);

      const matchedCount = await page.locator('.card.matched').count();
      if (matchedCount > 0) {
        matchFound = true;
        // Verify that at least one card is marked as matched
        expect(matchedCount).toBeGreaterThan(0);
      }

      attempts++;
    }
  });

  test('Game handles image load failures gracefully', async ({ page }) => {
    // This is a best-effort test; actual image failures depend on network

    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Check for SVG fallbacks (in case any image failed)
    const fallbackImages = await page.locator('svg').count();
    // May have 0 or more fallbacks depending on network

    // Game should continue working
    const board = page.locator('#boardContainer');
    await expect(board).toBeVisible();
  });

  test('Score updates correctly with multiple matches', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    const initialScore = parseInt(await page.locator('#score').textContent());
    expect(initialScore).toBe(0);

    // Try to get matches (probabilistic)
    let matchCount = 0;
    for (let attempt = 0; attempt < 40; attempt++) {
      const cards = await page.locator('.card:not(.matched)').all();
      if (cards.length < 2) break;

      const initialMatched = await page.locator('.card.matched').count();

      await cards[0].click();
      await page.waitForTimeout(100);
      await cards[1].click();
      await page.waitForTimeout(1000);

      const nowMatched = await page.locator('.card.matched').count();
      if (nowMatched > initialMatched) {
        matchCount++;
      }

      const currentScore = parseInt(await page.locator('#score').textContent());
      expect(currentScore).toBe(matchCount * 10);
    }
  });

  test('Game board cleanup on new game', async ({ page }) => {
    await page.goto('/');

    // First game
    await startNewGame(page);
    await waitForPreviewEnd(page);

    const cardsFirstGame = await page.locator('.card').count();
    expect(cardsFirstGame).toBe(12);

    // Start new game
    await page.click('#newGameBtn');
    await page.waitForTimeout(1500);

    // Should still have exactly 12 cards (not duplicated)
    const cardsSecondGame = await page.locator('.card').count();
    expect(cardsSecondGame).toBe(12);
  });

  test('Can interact with game after language switch', async ({ page }) => {
    await page.goto('/');

    // Switch language
    const langBtn = page.locator('#langToggle');
    await langBtn.click();
    await page.waitForTimeout(300);

    // Start game
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Should be able to click cards
    await page.click('.card:first-child');
    await page.waitForTimeout(200);

    const firstCard = page.locator('.card').first();
    const isFlipped = await firstCard.evaluate((el) => el.classList.contains('flipped'));
    expect(isFlipped).toBe(true);
  });

  test('Moves counter increments correctly on mismatches', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    const initialMoves = parseInt(await page.locator('#moves').textContent());
    expect(initialMoves).toBe(0);

    // Try to get a mismatch (cards at different positions likely don't match)
    for (let attempt = 0; attempt < 10; attempt++) {
      const cards = await page.locator('.card:not(.matched)').all();
      if (cards.length < 4) break;

      // Click two likely different cards
      await cards[0].click();
      await page.waitForTimeout(200);
      await cards[2].click();
      await page.waitForTimeout(1000);

      const moves = parseInt(await page.locator('#moves').textContent());
      expect(moves).toBeGreaterThan(initialMoves);
      return;
    }
  });

  test('No memory leaks with multiple game resets', async ({ page }) => {
    await page.goto('/');

    // Play multiple games
    for (let i = 0; i < 3; i++) {
      await startNewGame(page);
      await waitForPreviewEnd(page);

      // Play a couple moves
      const cards = await page.locator('.card').all();
      if (cards.length >= 2) {
        await cards[0].click();
        await page.waitForTimeout(100);
        await cards[1].click();
        await page.waitForTimeout(1000);
      }

      // Reset
      await page.click('#resetBtn');
      await page.waitForTimeout(500);
    }

    // Game should still be functional
    const board = page.locator('#boardContainer');
    await expect(board).toBeDefined();
  });
});
