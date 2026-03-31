// Scryfall API 配置
const SCRYFALL_API = 'https://api.scryfall.com/cards/random';
const MTG_CARD_BACK = 'https://images.scryfall.io/file/scryfall-symbols/card-back.jpg';

class MTGCard {
    constructor(name, imageUrl, id) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.id = id;
        this.flipped = false;
        this.matched = false;
    }
}

class Game {
    constructor() {
        this.board = [];
        this.selectedCards = [];
        this.score = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.gameInProgress = false;
        this.gameWon = false;
        this.cheatMode = false;
        this.previewMode = false;
        this.previewTimer = null;
        this.isLoadingGame = false; // Prevent multiple simultaneous game loads

        // Game mode
        this.gameMode = localStorage.getItem('gameMode') || 'mtg';
        this.cardAdapter = getCardAdapter(this.gameMode);

        this.boardElement = document.getElementById('gameBoard');
        this.loadingElement = document.getElementById('loading');
        this.boardContainer = document.getElementById('boardContainer');
        this.errorElement = document.getElementById('errorMessage');
        this.statusElement = document.getElementById('gameStatus');

        this.attachEventListeners();
        this.updateGameModeButtons();
        // 不自动开始游戏，等待用户点击"新游戏"按钮
    }

    attachEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('cheatModeBtn').addEventListener('click', () => this.toggleCheatMode());

        // Game mode buttons
        document.getElementById('mtgModeBtn').addEventListener('click', () => this.setGameMode('mtg'));
        document.getElementById('pokemonModeBtn').addEventListener('click', () => this.setGameMode('pokemon'));
        document.getElementById('yugiohModeBtn').addEventListener('click', () => this.setGameMode('yugioh'));
    }

    async startNewGame() {
        // Prevent multiple simultaneous game loads
        if (this.isLoadingGame) {
            return;
        }

        this.isLoadingGame = true;
        this.board = [];
        this.selectedCards = [];
        this.score = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.gameWon = false;
        this.gameInProgress = false;
        this.previewMode = false;
        this.cheatMode = false;

        // Clear cheat mode button state
        const cheatBtn = document.getElementById('cheatModeBtn');
        if (cheatBtn) {
            cheatBtn.classList.remove('active');
        }

        // Clear any existing preview timer
        if (this.previewTimer) {
            clearTimeout(this.previewTimer);
        }

        this.showLoading();

        try {
            const cards = await this.fetchCards(6);
            this.totalPairs = cards.length;
            this.initializeBoard(cards);
            this.hideLoading();
            this.showPreview();
        } catch (error) {
            this.showError(t('fetchError') + error.message);
            console.error('API Error:', error);
        } finally {
            this.isLoadingGame = false;
        }
    }

    showPreview() {
        // Show all cards flipped (face up)
        this.previewMode = true;
        this.board.forEach(card => card.flipped = true);
        this.render();

        // Wait for all card images to load before starting the timer
        this.waitForImagesLoaded().then(() => {
            // After 3 seconds, flip cards back and start game
            this.previewTimer = setTimeout(() => {
                this.previewMode = false;
                this.board.forEach(card => card.flipped = false);
                this.gameInProgress = true;
                this.render();
            }, 3000);
        });
    }

    waitForImagesLoaded() {
        return new Promise((resolve) => {
            const images = this.boardElement.querySelectorAll('img');

            if (images.length === 0) {
                // No images to load
                resolve();
                return;
            }

            let loadedCount = 0;
            const totalImages = images.length;

            const checkAllLoaded = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };

            images.forEach(img => {
                if (img.complete) {
                    // Image is already cached/loaded
                    checkAllLoaded();
                } else {
                    // Wait for image to load or fail
                    img.addEventListener('load', checkAllLoaded, { once: true });
                    img.addEventListener('error', checkAllLoaded, { once: true });
                }
            });
        });
    }

    async fetchCards(count, retries = 3) {
        const cards = [];
        const uniqueNames = new Set();
        let attempts = 0;
        const maxAttempts = count * 10; // 防止无限循环

        while (cards.length < count && attempts < maxAttempts) {
            try {
                const cardData = await this.cardAdapter.fetchCard();

                // 检查卡牌是否是新的
                if (cardData.imageUrl && !uniqueNames.has(cardData.name)) {
                    cards.push(new MTGCard(cardData.name, cardData.imageUrl, cardData.id));
                    uniqueNames.add(cardData.name);
                }
            } catch (error) {
                console.error('Error fetching card:', error);
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            attempts++;
        }

        if (cards.length < count) {
            throw new Error(t('insufficientCards') + cards.length + t('insufficientCardsOut') + count + t('insufficientCardsEnd'));
        }

        return cards;
    }

    initializeBoard(uniqueCards) {
        // 创建配对：每张卡牌出现两次
        uniqueCards.forEach((card, index) => {
            this.board.push(new MTGCard(card.name, card.imageUrl, `${card.id}-1`));
            this.board.push(new MTGCard(card.name, card.imageUrl, `${card.id}-2`));
        });

        // 随机打乱
        this.shuffleBoard();
    }

    shuffleBoard() {
        for (let i = this.board.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.board[i], this.board[j]] = [this.board[j], this.board[i]];
        }
    }

    handleCardClick(cardIndex) {
        const card = this.board[cardIndex];

        // 在预览模式下禁止点击卡牌
        if (this.previewMode) {
            return;
        }

        // 在作弊模式下禁止点击卡牌
        if (this.cheatMode) {
            return;
        }

        // 防止点击已匹配或已选中的卡牌
        if (card.matched || this.selectedCards.includes(cardIndex) || this.selectedCards.length >= 2) {
            return;
        }

        // 翻转卡牌
        card.flipped = true;
        this.selectedCards.push(cardIndex);
        this.render();

        if (this.selectedCards.length === 2) {
            this.checkMatch();
        }
    }

    checkMatch() {
        const card1 = this.board[this.selectedCards[0]];
        const card2 = this.board[this.selectedCards[1]];

        this.moves++;

        if (card1.name === card2.name) {
            // 匹配成功
            setTimeout(() => this.handleMatchSuccess(), 600);
        } else {
            // 匹配失败
            setTimeout(() => this.handleMatchFailure(), 1000);
        }
    }

    handleMatchSuccess() {
        const card1Idx = this.selectedCards[0];
        const card2Idx = this.selectedCards[1];
        
        this.board[card1Idx].matched = true;
        this.board[card2Idx].matched = true;
        
        this.score += 10;
        this.matchedPairs++;
        
        this.selectedCards = [];
        this.render();

        if (this.matchedPairs === this.totalPairs) {
            this.handleGameWin();
        }
    }

    handleMatchFailure() {
        // 取消选中
        this.board[this.selectedCards[0]].flipped = false;
        this.board[this.selectedCards[1]].flipped = false;

        this.statusElement.textContent = t('noMatch');
        this.statusElement.classList.add('warning');
        
        this.selectedCards = [];
        this.render();

        setTimeout(() => {
            this.statusElement.textContent = '';
            this.statusElement.classList.remove('warning');
        }, 1500);
    }

    handleGameWin() {
        this.gameWon = true;
        this.statusElement.textContent = t('gameComplete') + this.score + t('gameCompleteMoves') + this.moves + (currentLanguage === 'zh' ? t('gameCompleteEnd') : '');
        this.statusElement.classList.add('success');
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('remaining').textContent = this.totalPairs - this.matchedPairs;
    }

    render() {
        this.boardElement.innerHTML = '';
        
        this.board.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            if (card.flipped || card.matched || this.cheatMode) cardElement.classList.add('flipped');
            if (card.matched) cardElement.classList.add('matched');
            if (this.selectedCards.includes(index)) cardElement.classList.add('selected');

            const innerDiv = document.createElement('div');
            innerDiv.className = 'card-inner';

            // 正面（卡牌背面 - 蓝色背景）
            const front = document.createElement('div');
            front.className = 'card-face card-front';
            front.textContent = '⚔️';
            innerDiv.appendChild(front);

            // 背面（卡牌图片）
            const back = document.createElement('div');
            back.className = 'card-face card-back';
            const img = document.createElement('img');
            img.src = card.imageUrl;
            img.alt = card.name;
            img.onerror = () => {
                img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22140%22%3E%3Crect fill=%22%23ccc%22 width=%22100%22 height=%22140%22/%3E%3Ctext x=%2250%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3EImage Not Available%3C/text%3E%3C/svg%3E';
            };
            back.appendChild(img);
            innerDiv.appendChild(back);

            cardElement.appendChild(innerDiv);

            // 添加卡牌名称
            // const nameTag = document.createElement('div');
            // nameTag.className = 'card-name';
            // nameTag.textContent = card.name;
            // cardElement.appendChild(nameTag);

            cardElement.addEventListener('click', () => this.handleCardClick(index));
            this.boardElement.appendChild(cardElement);
        });

        this.updateUI();
    }

    resetGame() {
        // Clear any existing preview timer
        if (this.previewTimer) {
            clearTimeout(this.previewTimer);
        }
        this.startNewGame();
    }

    toggleCheatMode() {
        this.cheatMode = !this.cheatMode;
        const cheatBtn = document.getElementById('cheatModeBtn');

        if (this.cheatMode) {
            cheatBtn.classList.add('active');
        } else {
            cheatBtn.classList.remove('active');
        }

        this.render();
    }

    setGameMode(mode) {
        if (mode !== this.gameMode) {
            // Clear any existing preview timer
            if (this.previewTimer) {
                clearTimeout(this.previewTimer);
            }

            this.gameMode = mode;
            this.cardAdapter = getCardAdapter(mode);
            localStorage.setItem('gameMode', mode);
            this.updateGameModeButtons();
            this.startNewGame();
        }
    }

    updateGameModeButtons() {
        const mtgBtn = document.getElementById('mtgModeBtn');
        const pokemonBtn = document.getElementById('pokemonModeBtn');
        const yugiohBtn = document.getElementById('yugiohModeBtn');

        [mtgBtn, pokemonBtn, yugiohBtn].forEach(btn => btn.classList.remove('active'));

        if (this.gameMode === 'mtg' && mtgBtn) mtgBtn.classList.add('active');
        else if (this.gameMode === 'pokemon' && pokemonBtn) pokemonBtn.classList.add('active');
        else if (this.gameMode === 'yugioh' && yugiohBtn) yugiohBtn.classList.add('active');
    }

    showLoading() {
        this.loadingElement.style.display = 'block';
        this.boardContainer.style.display = 'none';
        this.errorElement.style.display = 'none';
    }

    hideLoading() {
        this.loadingElement.style.display = 'none';
        this.boardContainer.style.display = 'block';
    }

    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
        this.loadingElement.style.display = 'none';
        this.boardContainer.style.display = 'none';
    }
}

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
