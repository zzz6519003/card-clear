const { test, expect } = require('@playwright/test');
const {
  startNewGame,
  waitForPreviewEnd,
  isCardFlipped,
  toggleCheatMode,
  isCheatModeActive,
  clickCard,
  getGameStats,
} = require('./helpers');

test.describe('Cheat Mode', () => {
  test('Cheat Mode button exists and is clickable', async ({ page }) => {
    await page.goto('/');

    const cheatBtn = page.locator('#cheatModeBtn');
    await expect(cheatBtn).toBeVisible();
    await expect(cheatBtn).toBeEnabled();
  });

  test('Activating cheat mode shows all cards face-up', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // After preview, cards should be face-down
    let firstCardFlipped = await isCardFlipped(page, 0);
    expect(firstCardFlipped).toBe(false);

    // Activate cheat mode
    await toggleCheatMode(page);

    // Now all cards should be face-up
    const cardCount = await page.locator('.card').count();
    for (let i = 0; i < cardCount; i++) {
      const flipped = await isCardFlipped(page, i);
      expect(flipped).toBe(true);
    }
  });

  test('Cheat mode button turns red when active', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    const cheatBtn = page.locator('#cheatModeBtn');

    // Should not have .active class initially
    let hasActive = await cheatBtn.evaluate((el) => el.classList.contains('active'));
    expect(hasActive).toBe(false);

    // Activate cheat mode
    await toggleCheatMode(page);

    // Should now have .active class
    hasActive = await cheatBtn.evaluate((el) => el.classList.contains('active'));
    expect(hasActive).toBe(true);
  });

  test('Clicking cards during cheat mode does nothing', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    await toggleCheatMode(page);

    const initialStats = await getGameStats(page);
    const initialMoves = initialStats.moves;

    // Try to click cards
    await clickCard(page, 0);
    await page.waitForTimeout(200);
    await clickCard(page, 1);
    await page.waitForTimeout(200);

    const updatedStats = await getGameStats(page);
    // Moves should not change
    expect(updatedStats.moves).toBe(initialMoves);
  });

  test('Deactivating cheat mode hides cards again', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Activate cheat mode
    await toggleCheatMode(page);

    // Cards should be visible
    let firstCardFlipped = await isCardFlipped(page, 0);
    expect(firstCardFlipped).toBe(true);

    // Deactivate cheat mode
    await toggleCheatMode(page);

    // Cards should be hidden again
    firstCardFlipped = await isCardFlipped(page, 0);
    expect(firstCardFlipped).toBe(false);
  });

  test('New Game disables cheat mode', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Activate cheat mode
    await toggleCheatMode(page);

    let isActive = await isCheatModeActive(page);
    expect(isActive).toBe(true);

    // Start new game
    await page.click('#newGameBtn');
    await page.waitForTimeout(1000);

    // Cheat mode should be disabled
    isActive = await isCheatModeActive(page);
    expect(isActive).toBe(false);
  });

  test('Reset button works with cheat mode active', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    await toggleCheatMode(page);

    let isActive = await isCheatModeActive(page);
    expect(isActive).toBe(true);

    // Click reset button
    await page.click('#resetBtn');
    await page.waitForTimeout(1000);

    // Should enter preview again
    const cardCount = await page.locator('.card').count();
    for (let i = 0; i < cardCount && i < 2; i++) {
      const flipped = await isCardFlipped(page, i);
      expect(flipped).toBe(true); // Cards still flipped from preview
    }

    // Wait for preview to end
    await waitForPreviewEnd(page);

    // Cheat mode should be off now
    isActive = await isCheatModeActive(page);
    expect(isActive).toBe(false);
  });

  test('Can enable cheat mode during preview', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);

    // Immediately activate cheat mode during preview
    await toggleCheatMode(page);

    let isActive = await isCheatModeActive(page);
    expect(isActive).toBe(true);

    // Cards should still be visible from cheat mode
    const firstCardFlipped = await isCardFlipped(page, 0);
    expect(firstCardFlipped).toBe(true);
  });
});
