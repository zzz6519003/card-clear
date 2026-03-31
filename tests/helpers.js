// Test helper functions for game E2E tests

/**
 * Start a new game and wait for cards to load
 * @param {import('@playwright/test').Page} page
 */
async function startNewGame(page) {
  await page.click('#newGameBtn');
  // Wait for loading spinner to appear
  await page.waitForSelector('#loading:visible', { timeout: 1000 }).catch(() => {});
  // Wait for board to appear (cards loaded)
  // Increased timeout to 20s to account for slow API responses
  await page.waitForSelector('#boardContainer:visible', { timeout: 20000 });

//   // 等待页面加载完成
// await page.waitForLoadState('networkidle'); 
// // 等待并点击 NEW GAME 按钮
// await page.getByRole('button', { name: /new game|开始新游戏/i }).click();
// // 等待游戏面板出现
// await page.waitForSelector('#boardContainer', { state: 'visible', timeout: 20000 });

}

/**
 * Wait for preview mode to end (cards flip back face-down)
 * Wait for all images to load + 3 second timer
 * @param {import('@playwright/test').Page} page
 */
async function waitForPreviewEnd(page) {
  // Wait for images to load and 3-second timer to complete
  // Add 2 second buffer for any delays
  await page.waitForTimeout(5500);
}

/**
 * Check if a specific card is in flipped (face-up) state
 * @param {import('@playwright/test').Page} page
 * @param {number} index - Card index (0-based)
 */
async function isCardFlipped(page, index) {
  const card = page.locator('.card').nth(index);
  return await card.evaluate((el) => {
    return el.classList.contains('flipped');
  });
}

/**
 * Get the image URL of a card
 * @param {import('@playwright/test').Page} page
 * @param {number} index - Card index (0-based)
 */
async function getCardImageUrl(page, index) {
  const img = page.locator('.card').nth(index).locator('img').first();
  return await img.getAttribute('src');
}

/**
 * Click on a specific card
 * @param {import('@playwright/test').Page} page
 * @param {number} index - Card index (0-based)
 */
async function clickCard(page, index) {
  await page.locator('.card').nth(index).click();
}

/**
 * Get total number of cards on board
 * @param {import('@playwright/test').Page} page
 */
async function getCardCount(page) {
  const cards = await page.locator('.card').count();
  return cards;
}

/**
 * Wait for game completion message to appear
 * @param {import('@playwright/test').Page} page
 */
async function waitForGameWin(page) {
  await page.waitForSelector('#gameStatus:has-text("Complete")', { timeout: 30000 });
}

/**
 * Get current game stats
 * @param {import('@playwright/test').Page} page
 */
async function getGameStats(page) {
  const score = await page.locator('#score').textContent();
  const moves = await page.locator('#moves').textContent();
  const remaining = await page.locator('#remaining').textContent();
  return {
    score: parseInt(score),
    moves: parseInt(moves),
    remaining: parseInt(remaining),
  };
}

/**
 * Toggle language between English and Chinese
 * @param {import('@playwright/test').Page} page
 */
async function toggleLanguage(page) {
  await page.click('#langToggle');
  // Wait for UI to update
  await page.waitForTimeout(300);
}

/**
 * Get current language (check button text)
 * @param {import('@playwright/test').Page} page
 */
async function getCurrentLanguage(page) {
  const buttonText = await page.locator('#langToggle').textContent();
  return buttonText === 'English' ? 'en' : 'zh';
}

/**
 * Switch game mode
 * @param {import('@playwright/test').Page} page
 * @param {'mtg' | 'pokemon' | 'yugioh'} mode
 */
async function setGameMode(page, mode) {
  const buttonId = {
    mtg: '#mtgModeBtn',
    pokemon: '#pokemonModeBtn',
    yugioh: '#yugiohModeBtn',
  }[mode];

  await page.click(buttonId);
  // Wait for loading/board update
  await page.waitForTimeout(500);
}

/**
 * Check if cheat mode is active
 * @param {import('@playwright/test').Page} page
 */
async function isCheatModeActive(page) {
  const btn = page.locator('#cheatModeBtn');
  const classList = await btn.evaluate((el) => el.className);
  return classList.includes('active');
}

/**
 * Toggle cheat mode
 * @param {import('@playwright/test').Page} page
 */
async function toggleCheatMode(page) {
  await page.click('#cheatModeBtn');
  await page.waitForTimeout(300);
}

/**
 * Play through a complete game for testing
 * @param {import('@playwright/test').Page} page
 */
async function playCompleteGame(page) {
  await startNewGame(page);
  await waitForPreviewEnd(page);

  // Count cards and try to match them by clicking randomly
  const cardCount = await getCardCount(page);
  const pairsCount = cardCount / 2;

  for (let i = 0; i < pairsCount; i++) {
    // Click first unmatched card
    const cards = await page.locator('.card:not(.matched)').all();
    if (cards.length >= 2) {
      await cards[0].click();
      await page.waitForTimeout(200);
      await cards[1].click();
      await page.waitForTimeout(1200); // Wait for match/mismatch animation
    }
  }

  // Wait for game completion
  await waitForGameWin(page);
}

module.exports = {
  startNewGame,
  waitForPreviewEnd,
  isCardFlipped,
  getCardImageUrl,
  clickCard,
  getCardCount,
  waitForGameWin,
  getGameStats,
  toggleLanguage,
  getCurrentLanguage,
  setGameMode,
  isCheatModeActive,
  toggleCheatMode,
  playCompleteGame,
};
