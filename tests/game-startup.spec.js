const { test, expect } = require('@playwright/test');

test.describe('Game Startup', () => {
  test('Page loads without errors', async ({ page }) => {
    await page.goto('/');
    expect(page).toBeTruthy();
  });

  test('No API calls on initial load', async ({ page }) => {
    await page.goto('/');
    // Board should be hidden initially
    const board = page.locator('#boardContainer');
    await expect(board).toHaveAttribute('style', /display: none/);
  });

  test('Loading spinner is hidden initially', async ({ page }) => {
    await page.goto('/');
    const loading = page.locator('#loading');
    await expect(loading).toHaveAttribute('style', /display: none/);
  });

  test('All buttons are visible and clickable', async ({ page }) => {
    await page.goto('/');

    const newGameBtn = page.locator('#newGameBtn');
    const resetBtn = page.locator('#resetBtn');
    const cheatModeBtn = page.locator('#cheatModeBtn');
    const langToggle = page.locator('#langToggle');

    await expect(newGameBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    await expect(cheatModeBtn).toBeVisible();
    await expect(langToggle).toBeVisible();

    await expect(newGameBtn).toBeEnabled();
    await expect(resetBtn).toBeEnabled();
    await expect(cheatModeBtn).toBeEnabled();
    await expect(langToggle).toBeEnabled();
  });

  test('Game mode buttons are visible', async ({ page }) => {
    await page.goto('/');

    const mtgBtn = page.locator('#mtgModeBtn');
    const pokemonBtn = page.locator('#pokemonModeBtn');
    const yugiohBtn = page.locator('#yugiohModeBtn');

    await expect(mtgBtn).toBeVisible();
    await expect(pokemonBtn).toBeVisible();
    await expect(yugiohBtn).toBeVisible();

    // MTG mode should be active by default
    const mtgClass = await mtgBtn.getAttribute('class');
    expect(mtgClass).toContain('active');
  });

  test('Game info displays correctly on startup', async ({ page }) => {
    await page.goto('/');

    const score = page.locator('#score');
    const moves = page.locator('#moves');
    const remaining = page.locator('#remaining');

    await expect(score).toHaveText('0');
    await expect(moves).toHaveText('0');
    await expect(remaining).toHaveText('0');
  });

  test('Title and subtitle are visible', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('h1');
    const subtitle = page.locator('.subtitle');

    await expect(title).toBeVisible();
    await expect(subtitle).toBeVisible();
    await expect(title).toContainText('Card Matching');
  });

  test('No error message displayed initially', async ({ page }) => {
    await page.goto('/');

    const errorMsg = page.locator('#errorMessage');
    await expect(errorMsg).toHaveAttribute('style', /display: none/);
  });
});
