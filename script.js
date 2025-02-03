class ColorGame {
    constructor() {
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1',
            '#FDCB6E', '#6C5CE7', '#FF8A5B',
            '#2ECC71', '#3498DB', '#9B59B6',
            '#E74C3C', '#F1C40F', '#1ABC9C'
        ];
        this.scoreElement = document.querySelector('[data-testid="score"] #scoreValue');
        this.colorBox = document.querySelector('[data-testid="colorBox"]');
        this.colorOptions = document.querySelectorAll('[data-testid="colorOption"]');
        this.gameStatus = document.querySelector('[data-testid="gameStatus"]');
        this.newGameButton = document.querySelector('[data-testid="newGameButton"]');

        this.score = 0;
        this.targetColor = '';

        this.initGame();
        this.attachEventListeners();
    }

    initGame() {
        // Reset score
        this.score = 0;
        this.scoreElement.textContent = this.score;

        // Select target color and set color options
        this.setTargetColor();
        this.setColorOptions();

        // Reset game status
        this.gameStatus.textContent = 'Make your first guess!';
        this.gameStatus.style.color = 'black';
    }

    setTargetColor() {
        // Randomly select target color
        this.targetColor = this.getRandomColor();
        this.colorBox.style.backgroundColor = this.targetColor;
    }

    setColorOptions() {
        // Create an array with the correct color and random incorrect colors
        const options = [this.targetColor];
        while (options.length < 6) {
            const randomColor = this.getRandomColor();
            if (!options.includes(randomColor)) {
                options.push(randomColor);
            }
        }

        // Shuffle the options
        const shuffledOptions = this.shuffleArray(options);

        // Set background colors for color option buttons
        this.colorOptions.forEach((option, index) => {
            option.style.backgroundColor = shuffledOptions[index];
            option.addEventListener('click', () => this.checkGuess(shuffledOptions[index]));
        });
    }

    checkGuess(selectedColor) {
        if (selectedColor === this.targetColor) {
            this.score++;
            this.scoreElement.textContent = this.score;
            this.gameStatus.textContent = 'Correct! Great job!';
            this.gameStatus.style.color = 'green';

            // Start a new round
            setTimeout(() => {
                this.setTargetColor();
                this.setColorOptions();
            }, 1000);
        } else {
            this.gameStatus.textContent = 'Wrong guess. Try again!';
            this.gameStatus.style.color = 'red';
        }
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    attachEventListeners() {
        // New game button event listener
        this.newGameButton.addEventListener('click', () => this.initGame());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ColorGame();
});
