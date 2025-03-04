class ColorGame {
    constructor() {
        // Constants
        this.ANIMATION_DURATION = 500;
        this.baseColors = [
            '#FF0000', '#00FF00', '#0000FF',
            '#FF00FF', '#FFFF00', '#00FFFF',
            '#FF8000', '#80FF00', '#0080FF',
            '#8000FF', '#FF0080', '#00FF80'
        ];

        this.maxLives = 5;
        this.currentLives = this.maxLives;
        this.maxHints = 3;
        this.maxHelp = 3;

        // Cache DOM elements
        this.elements = {
            score: document.querySelector('[data-testid="score"] #scoreValue'),
            colorBox: document.querySelector('[data-testid="colorBox"]'),
            colorOptions: document.querySelectorAll('[data-testid="colorOption"]'),
            gameStatus: document.querySelector('[data-testid="gameStatus"]'),
            newGameButton: document.querySelector('[data-testid="newGameButton"]'),
            hintButton: document.querySelector('[data-testid="hintButton"]'),
            helpButton: document.querySelector('[data-testid="helpButton"]'),
            hintCountDisplay: document.querySelector('[data-testid="hintCount"]'),
            helpCountDisplay: document.querySelector('[data-testid="helpCount"]')
        };

        // Game state
        this.state = {
            score: 0,
            targetColor: '',
            gameOver: false,
            isAnimating: false,
            hintsRemaining: this.maxHints,
            helpRemaining: this.maxHelp,
            colorOptions: [],
            eliminatedOptions: []
        };

        this.createInitialImage();
        this.createLivesDisplay();
        this.initGame();
        this.attachEventListeners();
    }

    createInitialImage() {
        this.initialImage = document.createElement('img');
        this.initialImage.src = 'https://img.freepik.com/free-photo/background-with-christmas-gifts-box-template_135149-77.jpg';
        this.initialImage.alt = 'Color Challenge';
        this.initialImage.style.width = '100%';
        this.initialImage.style.height = '100%';
        this.initialImage.style.objectFit = 'cover';
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

    useHelp() {
        if (this.state.helpRemaining <= 0 || this.state.gameOver) {
            this.updateGameStatus('No help remaining!', 'red');
            return;
        }

        // Reduce help count
        this.state.helpRemaining--;
        this.updateHelpDisplay();

        // Find incorrect color options
        const incorrectOptions = this.state.colorOptions.filter(
            color => color !== this.state.targetColor
        );

        // If all options have been eliminated, don't proceed
        if (incorrectOptions.length === 0) {
            this.updateGameStatus('No more options to eliminate!', 'red');
            return;
        }

        // Randomly select an incorrect option to eliminate
        let optionToEliminate;
        do {
            optionToEliminate = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        } while (this.state.eliminatedOptions.includes(optionToEliminate));

        // Find and fade out the option
        const optionIndex = this.state.colorOptions.indexOf(optionToEliminate);
        if (optionIndex !== -1) {
            const optionElement = this.elements.colorOptions[optionIndex];
            
            // Add eliminated option to tracking
            this.state.eliminatedOptions.push(optionToEliminate);

            // Fade out the option
            optionElement.style.opacity = '0.035';
            optionElement.disabled = true;

            // Update status
            this.updateGameStatus('An incorrect option has been eliminated!', 'blue');
        }
    }

    updateHelpDisplay() {
        if (this.elements.helpCountDisplay) {
            this.elements.helpCountDisplay.textContent = `Help: ${this.state.helpRemaining}`;
        }
    }

    async setColorOptions() {
        if (this.state.isAnimating) return;

        const options = this.generateContrastingColors(this.state.targetColor);
        const shuffledOptions = this.shuffleArray(options);

        // Clear previous color options
        this.state.colorOptions = [];

        const updatePromises = Array.from(this.elements.colorOptions).map(async (option, index) => {
            const newOption = option.cloneNode(true);
            newOption.disabled = this.state.gameOver;
            
            // Explicitly set the background color
            newOption.style.backgroundColor = shuffledOptions[index];
            
            // Store the color in the state
            this.state.colorOptions.push(shuffledOptions[index]);

            newOption.addEventListener('click', () => this.checkGuess(shuffledOptions[index]));
            option.parentNode.replaceChild(newOption, option);
        });

        await Promise.all(updatePromises);
        
        // Update color options in elements
        this.elements.colorOptions = document.querySelectorAll('[data-testid="colorOption"]');
    }

    provideHint() {
        // Check if hints are available
        if (this.state.hintsRemaining <= 0 || this.state.gameOver) {
            this.updateGameStatus('No hints remaining!', 'red');
            return;
        }

        // Reduce hint count
        this.state.hintsRemaining--;
        this.updateHintDisplay();

        // Find the correct color among options
        const correctColor = this.state.targetColor;
        
        // Calculate color differences
        const colorDifferences = this.state.colorOptions.map(color => 
            this.calculateColorDifference(color, correctColor)
        );

        // Find the closest color index
        const closestColorIndex = colorDifferences.indexOf(Math.min(...colorDifferences));
        const closestColor = this.state.colorOptions[closestColorIndex];

        // Generate hint messages
        const hintMessages = [
            `The correct color is close to the ${this.getColorName(closestColor)} color.`,
            `Pay attention to the color similar to ${this.getColorName(closestColor)}.`,
            `The target color shares similarities with the ${this.getColorName(closestColor)} option.`
        ];

        // Randomly select a hint message
        const hintMessage = hintMessages[Math.floor(Math.random() * hintMessages.length)];

        // Update game status with hint
        this.updateGameStatus(hintMessage, 'blue');
    }

    updateHintDisplay() {
        if (this.elements.hintCountDisplay) {
            this.elements.hintCountDisplay.textContent = `Hints: ${this.state.hintsRemaining}`;
        }
    }


    generateContrastingColors(baseColor) {
        const colors = new Set([baseColor]);

        while (colors.size < 6) {
            const randomColor = this.getRandomContrastingColor(baseColor);
            colors.add(randomColor);
        }

        return Array.from(colors);
    }

    getRandomContrastingColor(referenceColor) {
        const referenceRgb = this.hexToRgb(referenceColor);
        let newColor;

        do {
            newColor = {
                r: Math.floor(Math.random() * 256),
                g: Math.floor(Math.random() * 256),
                b: Math.floor(Math.random() * 256)
            };
        } while (this.getColorDifference(referenceRgb, newColor) < 150);

        return this.rgbToHex(newColor.r, newColor.g, newColor.b);
    }

    getColorDifference(rgb1, rgb2) {
        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    }

    // Helper method to calculate color difference
    calculateColorDifference(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    }

    getColorName(hexColor) {
        const colorNames = {
            '#FF0000': 'red',
            '#00FF00': 'green',
            '#0000FF': 'blue',
            '#FF00FF': 'magenta',
            '#FFFF00': 'yellow',
            '#00FFFF': 'cyan',
            '#FF8000': 'orange',
            '#80FF00': 'lime',
            '#0080FF': 'sky blue',
            '#8000FF': 'purple',
            '#FF0080': 'pink',
            '#00FF80': 'sea green'
        };

        return colorNames[hexColor] || 'unknown';
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
        element.style.transition = 'background-color 0.5s ease-in-out';
        element.style.backgroundColor = color;
        await new Promise(resolve => setTimeout(resolve, 300));
        element.style.transition = '';
    }

    initGame() {
        Object.assign(this.state, {
            score: 0,
            gameOver: false,
            isAnimating: false,
            hintsRemaining: this.maxHints,
            helpRemaining: this.maxHelp
        });

        // Reset color box to initial image
        this.elements.colorBox.innerHTML = '';
        this.elements.colorBox.appendChild(this.initialImage);

        this.currentLives = this.maxLives;
        this.elements.score.textContent = this.state.score;
        this.updateLivesDisplay();
        this.updateLivesDisplay();
        this.updateHintDisplay();
        this.updateHelpDisplay();
        this.startNewRound();

        this.elements.colorOptions.forEach(option => {
            option.disabled = false;
            option.style.opacity = '1';
            option.classList.remove('correct', 'incorrect');
        });
    }

    async setTargetColor() {
        const newColor = this.getRandomColor();
        this.state.targetColor = newColor;
        
        // Reset to initial image
        this.elements.colorBox.innerHTML = '';
        this.elements.colorBox.appendChild(this.initialImage);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async checkGuess(selectedColor) {
        if (this.state.gameOver || this.state.isAnimating) return;

        this.state.isAnimating = true;
        const isCorrect = selectedColor === this.state.targetColor;

        if (isCorrect) {
            // Reveal color
            this.elements.colorBox.innerHTML = ''; // Clear image
            this.elements.colorBox.style.backgroundColor = this.state.targetColor;

            this.state.score++;
            this.elements.score.textContent = this.state.score;
            this.updateGameStatus('Correct! Great job!', 'green');

            setTimeout(() => this.startNewRound(), this.ANIMATION_DURATION);
        } else {
            this.currentLives--;
            this.updateLivesDisplay();

            if (this.currentLives === 0) {
                // Reveal color when game is over
                this.elements.colorBox.innerHTML = ''; // Clear image
                this.elements.colorBox.style.backgroundColor = this.state.targetColor;

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

        this.state.eliminatedOptions = [];

        this.elements.colorOptions.forEach(option => {
            option.disabled = false;
            option.style.opacity = '1';
            option.classList.remove('correct', 'incorrect');
        });

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

        if (this.elements.hintButton) {
            this.elements.hintButton.addEventListener('click', () => this.provideHint());
        }

        if (this.elements.helpButton) {
            this.elements.helpButton.addEventListener('click', () => this.useHelp());
        }

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