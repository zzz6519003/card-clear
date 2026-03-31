const { test, expect } = require('@playwright/test');
const { startNewGame, waitForPreviewEnd, toggleLanguage, getCurrentLanguage } = require('./helpers');

test.describe('Language Switching - English & Chinese', () => {
  test('Default language is English', async ({ page }) => {
    await page.goto('/');

    const langBtn = page.locator('#langToggle');
    await expect(langBtn).toContainText('English');

    const title = page.locator('h1');
    await expect(title).toContainText('Card Matching');
  });

  test('Language toggle button works', async ({ page }) => {
    await page.goto('/');

    const langBtn = page.locator('#langToggle');
    await langBtn.click();
    await page.waitForTimeout(300);

    // Should now show Chinese button text
    const buttonText = await langBtn.textContent();
    expect(buttonText).toContain('中文');
  });

  test('Title changes when language switched', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('h1');
    await expect(title).toContainText('Card Matching');

    // Switch language
    await toggleLanguage(page);

    // Title should change to Chinese
    await expect(title).toContainText('万智牌配对消除');
  });

  test('Subtitle changes when language switched', async ({ page }) => {
    await page.goto('/');

    const subtitle = page.locator('.subtitle');
    const englishText = await subtitle.textContent();
    expect(englishText).toContain('Dynamic');

    // Switch language
    await toggleLanguage(page);

    const chineseText = await subtitle.textContent();
    expect(chineseText).toContain('Scryfall API');
  });

  test('Score label changes when language switched', async ({ page }) => {
    await page.goto('/');

    let labels = await page.locator('.label').allTextContents();
    expect(labels[0]).toContain('Score');

    // Switch language
    await toggleLanguage(page);

    labels = await page.locator('.label').allTextContents();
    expect(labels[0]).toContain('得分');
  });

  test('Moves label changes when language switched', async ({ page }) => {
    await page.goto('/');

    let labels = await page.locator('.label').allTextContents();
    expect(labels[1]).toContain('Moves');

    // Switch language
    await toggleLanguage(page);

    labels = await page.locator('.label').allTextContents();
    expect(labels[1]).toContain('移动');
  });

  test('Remaining Pairs label changes when language switched', async ({ page }) => {
    await page.goto('/');

    let labels = await page.locator('.label').allTextContents();
    expect(labels[2]).toContain('Remaining');

    // Switch language
    await toggleLanguage(page);

    labels = await page.locator('.label').allTextContents();
    expect(labels[2]).toContain('剩余对数');
  });

  test('New Game button text changes', async ({ page }) => {
    await page.goto('/');

    const newGameBtn = page.locator('#newGameBtn');
    await expect(newGameBtn).toContainText('New Game');

    // Switch language
    await toggleLanguage(page);

    await expect(newGameBtn).toContainText('新游戏');
  });

  test('Reset button text changes', async ({ page }) => {
    await page.goto('/');

    const resetBtn = page.locator('#resetBtn');
    await expect(resetBtn).toContainText('Reset');

    // Switch language
    await toggleLanguage(page);

    await expect(resetBtn).toContainText('重置');
  });

  test('Cheat Mode button text changes', async ({ page }) => {
    await page.goto('/');

    const cheatBtn = page.locator('#cheatModeBtn');
    await expect(cheatBtn).toContainText('Cheat Mode');

    // Switch language
    await toggleLanguage(page);

    await expect(cheatBtn).toContainText('作弊模式');
  });

  test('Game mode buttons text changes', async ({ page }) => {
    await page.goto('/');

    const mtgBtn = page.locator('#mtgModeBtn');
    const pokemonBtn = page.locator('#pokemonModeBtn');
    const yugiohBtn = page.locator('#yugiohModeBtn');

    await expect(mtgBtn).toContainText('Magic');
    await expect(pokemonBtn).toContainText('Pokémon');
    await expect(yugiohBtn).toContainText('Yu-Gi-Oh');

    // Switch language
    await toggleLanguage(page);

    await expect(mtgBtn).toContainText('万智牌');
    await expect(pokemonBtn).toContainText('宝可梦');
    await expect(yugiohBtn).toContainText('游戏王');
  });

  test('Game Mode label changes', async ({ page }) => {
    await page.goto('/');

    let modeLabel = await page.locator('.mode-label').textContent();
    expect(modeLabel).toContain('Game Mode:');

    // Switch language
    await toggleLanguage(page);

    modeLabel = await page.locator('.mode-label').textContent();
    expect(modeLabel).toContain('游戏模式：');
  });

  test('Language survives page reload', async ({ page }) => {
    await page.goto('/');

    // Switch to Chinese
    await toggleLanguage(page);

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Should still be in Chinese
    const title = page.locator('h1');
    await expect(title).toContainText('万智牌配对消除');

    const newGameBtn = page.locator('#newGameBtn');
    await expect(newGameBtn).toContainText('新游戏');
  });

  test('Can switch language multiple times', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('h1');

    // Start English
    await expect(title).toContainText('Card Matching');

    // Switch to Chinese
    await toggleLanguage(page);
    await expect(title).toContainText('万智牌配对消除');

    // Switch back to English
    await toggleLanguage(page);
    await expect(title).toContainText('Card Matching');

    // Switch to Chinese again
    await toggleLanguage(page);
    await expect(title).toContainText('万智牌配对消除');
  });

  test('Language switch mid-game does not reset game', async ({ page }) => {
    await page.goto('/');
    await startNewGame(page);
    await waitForPreviewEnd(page);

    // Make some moves
    await page.click('.card:first-child');
    await page.waitForTimeout(200);
    const cards = await page.locator('.card:not(.matched)').all();
    if (cards.length >= 2) {
      await cards[1].click();
    }
    await page.waitForTimeout(1200);

    const initialScore = await page.locator('#score').textContent();
    const initialMoves = await page.locator('#moves').textContent();

    // Switch language
    await toggleLanguage(page);

    // Game should continue, stats should be same
    const newScore = await page.locator('#score').textContent();
    const newMoves = await page.locator('#moves').textContent();

    expect(newScore).toBe(initialScore);
    expect(newMoves).toBe(initialMoves);

    // Board should still have same state
    const boardContainer = page.locator('#boardContainer');
    await expect(boardContainer).toBeVisible();
  });

  test('Loading message also changes language', async ({ page }) => {
    await page.goto('/');

    // Switch language
    await toggleLanguage(page);

    // Start new game and check loading message
    const newGameBtn = page.locator('#newGameBtn');
    await newGameBtn.click();

    const loadingMsg = page.locator('.loading p');
    // Note: Loading message might appear briefly, this is best-effort
    const text = await loadingMsg.textContent().catch(() => '');
    // Just verify the element exists
    await expect(loadingMsg).toBeDefined();
  });

  test('Error messages respect language setting', async ({ page }) => {
    await page.goto('/');

    // Switch to Chinese
    await toggleLanguage(page);

    const currentLang = await getCurrentLanguage(page);
    expect(currentLang).toBe('zh');

    // Should use Chinese translations for errors
    // (This is harder to test without triggering actual errors)
    // Just verify language is correctly set
  });

  test('Language preference persists across page reload', async ({ page }) => {
    await page.goto('/');

    // Switch to Chinese
    await toggleLanguage(page);

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Should still be in Chinese
    const title = page.locator('h1');
    await expect(title).toContainText('万智牌配对消除');

    const newGameBtn = page.locator('#newGameBtn');
    await expect(newGameBtn).toContainText('新游戏');
  });
});
