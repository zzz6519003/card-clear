// Card API Adapters - Abstraction layer for different card sources

class CardAPIAdapter {
    /**
     * Base class for card API adapters
     * All adapters must implement these methods to normalize card data
     */
    async fetchCard() {
        throw new Error('fetchCard() must be implemented by subclass');
    }

    getName() {
        throw new Error('getName() must be implemented by subclass');
    }
}

/**
 * Scryfall API Adapter (Magic: The Gathering)
 * Uses the random card endpoint for direct random card fetching
 */
class ScryfallAdapter extends CardAPIAdapter {
    constructor() {
        super();
        this.apiUrl = 'https://api.scryfall.com/cards/random';
    }

    async fetchCard() {
        const response = await fetch(this.apiUrl);
        if (!response.ok) {
            if (response.status === 429) {
                // Rate limited - wait and retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchCard();
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Validate card has required fields
        if (!data.image_uris || !data.image_uris.normal || !data.name) {
            throw new Error('Card missing required image or name');
        }

        return {
            name: data.name,
            imageUrl: data.image_uris.normal,
            id: data.id
        };
    }

    getName() {
        return 'MTG';
    }
}

/**
 * Pokémon TCG API Adapter
 * Fetches from a list of all available cards and selects random ones
 */
class PokemonAdapter extends CardAPIAdapter {
    constructor() {
        super();
        this.baseUrl = 'https://api.pokemontcg.io/v2/cards';
    }

    async fetchCard() {
        try {
            // Get a random page of cards to avoid caching the entire dataset
            const randomPage = Math.floor(Math.random() * 1000) + 1; // Random page between 1-1000
            const pageSize = 20;

            const response = await fetch(`${this.baseUrl}?q=images.large:*&pageSize=${pageSize}&page=${randomPage}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || data.data.length === 0) {
                throw new Error('No cards found in response');
            }

            // Get random card from the page
            const randomCard = data.data[Math.floor(Math.random() * data.data.length)];
            const cardData = randomCard;

            // Validate card has required fields
            if (!cardData.images || !cardData.images.large || !cardData.name) {
                throw new Error('Card missing required image or name');
            }

            return {
                name: cardData.name,
                imageUrl: cardData.images.large,
                id: cardData.id
            };
        } catch (error) {
            throw new Error(`Failed to fetch Pokémon card: ${error.message}`);
        }
    }

    getName() {
        return 'Pokemon';
    }
}

/**
 * Yu-Gi-Oh TCG Adapter
 * Uses a static list of popular Yu-Gi-Oh cards with direct image URLs
 */
class YuGiOhAdapter extends CardAPIAdapter {
    constructor() {
        super();
        // Popular Yu-Gi-Oh cards with image URLs
        this.popularCards = [
            { name: 'Blue-Eyes White Dragon', id: '89631139', imageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg' },
            { name: 'Dark Magician', id: '46986414', imageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg' },
            { name: 'Exodia the Forbidden One', id: '33396948', imageUrl: 'https://images.ygoprodeck.com/images/cards/33396948.jpg' },
            { name: 'Red-Eyes Black Dragon', id: '74677422', imageUrl: 'https://images.ygoprodeck.com/images/cards/74677422.jpg' },
            { name: 'Summoned Skull', id: '6104371', imageUrl: 'https://images.ygoprodeck.com/images/cards/6104371.jpg' },
            { name: 'Celtic Guardian', id: '90590113', imageUrl: 'https://images.ygoprodeck.com/images/cards/90590113.jpg' },
            { name: 'Pot of Greed', id: '55144522', imageUrl: 'https://images.ygoprodeck.com/images/cards/55144522.jpg' },
            { name: 'Monster Reborn', id: '83764718', imageUrl: 'https://images.ygoprodeck.com/images/cards/83764718.jpg' },
            { name: 'Raigeki', id: '12580477', imageUrl: 'https://images.ygoprodeck.com/images/cards/12580477.jpg' },
            { name: 'Dark Hole', id: '53129469', imageUrl: 'https://images.ygoprodeck.com/images/cards/53129469.jpg' },
            { name: 'Mirror Force', id: '44095762', imageUrl: 'https://images.ygoprodeck.com/images/cards/44095762.jpg' },
            { name: 'Solemn Judgment', id: '41420027', imageUrl: 'https://images.ygoprodeck.com/images/cards/41420027.jpg' },
            { name: 'Blue-Eyes Alternative White Dragon', id: '8801830', imageUrl: 'https://images.ygoprodeck.com/images/cards/8801830.jpg' },
            { name: 'Swordsoul Strategist Longyuan', id: '85409204', imageUrl: 'https://images.ygoprodeck.com/images/cards/85409204.jpg' },
            { name: 'Shaddoll Fusion', id: '27207830', imageUrl: 'https://images.ygoprodeck.com/images/cards/27207830.jpg' }
        ];
    }

    async fetchCard() {
        try {
            // Return a random card from the popular cards list
            const randomIndex = Math.floor(Math.random() * this.popularCards.length);
            const card = this.popularCards[randomIndex];

            return {
                name: card.name,
                imageUrl: card.imageUrl,
                id: card.id
            };
        } catch (error) {
            throw new Error(`Failed to fetch Yu-Gi-Oh card: ${error.message}`);
        }
    }

    getName() {
        return 'YuGiOh';
    }
}

// Create singleton instances
const adapters = {
    'mtg': new ScryfallAdapter(),
    'pokemon': new PokemonAdapter(),
    'yugioh': new YuGiOhAdapter()
};

// Get adapter by mode name
function getCardAdapter(mode) {
    return adapters[mode] || adapters['mtg'];
}
