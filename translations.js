// Language translations
const translations = {
    'en': {
        // Page title and headings
        'pageTitle': 'MTG Card Matching Game',
        'mainTitle': '🎴 Card Matching',
        'subtitle': 'Dynamic Card Game with Scryfall API',

        // Game stats labels
        'score': 'Score',
        'moves': 'Moves',
        'remaining': 'Remaining Pairs',

        // Loading and errors
        'loading': 'Fetching cards from Scryfall...',
        'fetchError': 'Failed to fetch cards: ',
        'insufficientCards': 'Only fetched ',
        'insufficientCardsOut': ' / ',
        'insufficientCardsEnd': ' cards',

        // Game messages
        'noMatch': '❌ No match, keep trying!',
        'gameComplete': '🎉 Complete! Score: ',
        'gameCompleteMoves': ', Moves: ',

        // Buttons
        'newGame': 'New Game',
        'reset': 'Reset',
        'languageToggle': 'English',
        'cheatMode': 'Cheat Mode',

        // Game modes
        'gameModeLabel': 'Game Mode:',
        'mtgMode': 'Magic',
        'pokemonMode': 'Pokémon',
        'yugiohMode': 'Yu-Gi-Oh'
    },
    'zh': {
        // Page title and headings
        'pageTitle': '万智牌卡牌配对消除游戏',
        'mainTitle': '🎴 万智牌配对消除',
        'subtitle': 'Scryfall API 动态卡牌游戏',

        // Game stats labels
        'score': '得分',
        'moves': '移动',
        'remaining': '剩余对数',

        // Loading and errors
        'loading': '正在从 Scryfall 获取卡牌...',
        'fetchError': '获取卡牌失败: ',
        'insufficientCards': '仅获取 ',
        'insufficientCardsOut': ' / ',
        'insufficientCardsEnd': ' 张卡牌',

        // Game messages
        'noMatch': '❌ 不匹配，继续加油！',
        'gameComplete': '🎉 完成！得分: ',
        'gameCompleteMoves': '，共 ',
        'gameCompleteEnd': ' 步',

        // Buttons
        'newGame': '新游戏',
        'reset': '重置',
        'languageToggle': '中文',
        'cheatMode': '作弊模式',

        // Game modes
        'gameModeLabel': '游戏模式：',
        'mtgMode': '万智牌',
        'pokemonMode': '宝可梦',
        'yugiohMode': '游戏王'
    }
};

// Get current language (default to en)
let currentLanguage = localStorage.getItem('gameLanguage') || 'en';

// Function to get translated string
function t(key, ...args) {
    let text = translations[currentLanguage][key] || translations['en'][key] || key;

    // Support simple variable replacement using arguments
    if (args.length > 0) {
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
    }

    return text;
}

// Function to set language and update UI
function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('gameLanguage', lang);
        // Update document language attribute
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        // Update page title
        document.title = t('pageTitle');
        // Update game UI
        updateGameUI();
    }
}

// Function to update all UI elements (called when language changes)
function updateGameUI() {
    // Update header
    const mainTitle = document.querySelector('h1');
    if (mainTitle) mainTitle.textContent = t('mainTitle');

    const subtitle = document.querySelector('.subtitle');
    if (subtitle) subtitle.textContent = t('subtitle');

    // Update labels
    const labels = document.querySelectorAll('.label');
    const labelKeys = ['score', 'moves', 'remaining'];
    labels.forEach((label, index) => {
        if (index < labelKeys.length) {
            label.textContent = t(labelKeys[index]) + ':';
        }
    });

    // Update loading text
    const loadingText = document.querySelector('.loading p');
    if (loadingText) loadingText.textContent = t('loading');

    // Update buttons
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) newGameBtn.textContent = t('newGame');

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.textContent = t('reset');

    // Update language toggle button
    const langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.textContent = t('languageToggle');

    // Update cheat mode button
    const cheatBtn = document.getElementById('cheatModeBtn');
    if (cheatBtn) cheatBtn.textContent = t('cheatMode');

    // Update game mode buttons
    const mtgBtn = document.getElementById('mtgModeBtn');
    if (mtgBtn) mtgBtn.textContent = t('mtgMode');

    const pokemonBtn = document.getElementById('pokemonModeBtn');
    if (pokemonBtn) pokemonBtn.textContent = t('pokemonMode');

    const yugiohBtn = document.getElementById('yugiohModeBtn');
    if (yugiohBtn) yugiohBtn.textContent = t('yugiohMode');

    const modeLabel = document.querySelector('.mode-label');
    if (modeLabel) modeLabel.textContent = t('gameModeLabel');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial language
    setLanguage(currentLanguage);

    // Add language toggle event listener
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const newLanguage = currentLanguage === 'en' ? 'zh' : 'en';
            setLanguage(newLanguage);
            updateGameUI();
        });
    }
});
