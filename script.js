class ColorGame {
    constructor() {
        // Constants
        this.ANIMATION_DURATION = 1000;
        this.VARIATION_AMOUNT = 76;
        this.baseColors = [
            '#FF0000', '#00FF00', '#0000FF',
            '#FF00FF', '#FFFF00', '#00FFFF',
            '#FF8000', '#80FF00', '#0080FF',
            '#8000FF', '#FF0080', '#00FF80'
        ];

        this.maxLives = 5;
        this.currentLives = this.maxLives;

        // Cache DOM elements
        this.elements = {
            score: document.querySelector('[data-testid="score"] #scoreValue'),
            colorBox: document.querySelector('[data-testid="colorBox"]'),
            colorOptions: document.querySelectorAll('[data-testid="colorOption"]'),
            gameStatus: document.querySelector('[data-testid="gameStatus"]'),
            newGameButton: document.querySelector('[data-testid="newGameButton"]')
        };

        // Game state
        this.state = {
            score: 0,
            targetColor: '',
            gameOver: false,
            isAnimating: false
        };

        this.createLivesDisplay();
        this.initGame();
        this.attachEventListeners();
    }

    createLivesDisplay() {
        const livesContainer = document.createElement('div');
        livesContainer.setAttribute('data-testid', 'livesDisplay');
        livesContainer.className = 'lives-container';

        this.livesDisplay = document.createElement('div');
        this.livesDisplay.className = 'lives';
        livesContainer.appendChild(this.livesDisplay);

        this.elements.score.parentElement.after(livesContainer);
        this.updateLivesDisplay();
    }

    updateLivesDisplay() {
        const fullHearts = '❤️'.repeat(this.currentLives);
        const emptyHearts = '🖤'.repeat(this.maxLives - this.currentLives);
        this.livesDisplay.innerHTML = fullHearts + emptyHearts;
    }

    getRandomColor() {
        const excludeColors = new Set(Array.from(this.elements.colorOptions)
            .map(option => option.style.backgroundColor));
        let newColor;

        do {
            newColor = this.baseColors[Math.floor(Math.random() * this.baseColors.length)];
        } while (excludeColors.has(newColor));

        return newColor;
    }

    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    generateSimilarColors(baseColor) {
        const rgb = this.hexToRgb(baseColor);
        const colors = new Set([baseColor]);

        while (colors.size < 6) {
            const newColor = {
                r: this.clamp(rgb.r + (Math.random() - 0.5) * this.VARIATION_AMOUNT * 2, 0, 255),
                g: this.clamp(rgb.g + (Math.random() - 0.5) * this.VARIATION_AMOUNT * 2, 0, 255),
                b: this.clamp(rgb.b + (Math.random() - 0.5) * this.VARIATION_AMOUNT * 2, 0, 255)
            };

            colors.add(this.rgbToHex(newColor.r, newColor.g, newColor.b));
        }

        return Array.from(colors);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    async animateColorChange(element, color) {
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = color;
        await new Promise(resolve => setTimeout(resolve, 300));
        element.style.transition = '';
    }

    initGame() {
        Object.assign(this.state, {
            score: 0,
            gameOver: false,
            isAnimating: false
        });

        this.currentLives = this.maxLives;
        this.elements.score.textContent = this.state.score;
        this.updateLivesDisplay();
        this.startNewRound();

        this.elements.colorOptions.forEach(option => {
            option.disabled = false;
            option.classList.remove('correct', 'incorrect');
        });
    }

    async setTargetColor() {
        const newColor = this.getRandomColor();
        this.state.targetColor = newColor;
        await this.animateColorChange(this.elements.colorBox, newColor);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async setColorOptions() {
        if (this.state.isAnimating) return;

        const options = this.generateSimilarColors(this.state.targetColor);
        const shuffledOptions = this.shuffleArray(options);

        const updatePromises = Array.from(this.elements.colorOptions).map(async (option, index) => {
            const newOption = option.cloneNode(true);
            newOption.disabled = this.state.gameOver;
            await this.animateColorChange(newOption, shuffledOptions[index]);

            newOption.addEventListener('click', () => this.checkGuess(shuffledOptions[index]));
            option.parentNode.replaceChild(newOption, option);
        });

        await Promise.all(updatePromises);
        this.elements.colorOptions = document.querySelectorAll('[data-testid="colorOption"]');
    }

    async checkGuess(selectedColor) {
        if (this.state.gameOver || this.state.isAnimating) return;

        this.state.isAnimating = true;
        const isCorrect = selectedColor === this.state.targetColor;

        if (isCorrect) {
            this.state.score++;
            this.elements.score.textContent = this.state.score;
            this.updateGameStatus('Correct! Great job!', 'green');

            setTimeout(() => this.startNewRound(), this.ANIMATION_DURATION);
        } else {
            this.currentLives--;
            this.updateLivesDisplay();

            if (this.currentLives === 0) {
                this.state.gameOver = true;
                this.updateGameStatus(`Game Over! Final Score: ${this.state.score}`, 'red');
                this.elements.colorOptions.forEach(option => option.disabled = true);
            } else {
                this.updateGameStatus(
                    `Wrong guess! ${this.currentLives} ${this.currentLives === 1 ? 'life' : 'lives'} remaining`,
                    'red'
                );
            }
        }

        this.state.isAnimating = false;
    }

    updateGameStatus(message, color) {
        this.elements.gameStatus.textContent = message;
        this.elements.gameStatus.style.color = color;
    }

    async startNewRound() {
        if (this.state.gameOver) return;

        await this.setTargetColor();
        await this.setColorOptions();
        this.updateGameStatus('Make your guess!', 'black');
    }

    attachEventListeners() {
        this.elements.newGameButton.addEventListener('click', () => {
            if (!this.state.isAnimating) {
                this.initGame();
            }
        });

        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state.gameOver || this.state.isAnimating) return;

            const keyToIndex = {
                '1': 0, '2': 1, '3': 2,
                '4': 3, '5': 4, '6': 5
            };

            const index = keyToIndex[e.key];
            if (index !== undefined && this.elements.colorOptions[index]) {
                this.elements.colorOptions[index].click();
            }
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ColorGame();
});
