// src/components/ui/GameOver.ts

export class GameOver {
    private container: HTMLDivElement;
    private playAgainButton: HTMLButtonElement;

    constructor(score: number, onPlayAgain: () => void) {
        // Create the game over container
        this.container = document.createElement('div');
        this.applyContainerStyles();

        // Create content
        this.container.innerHTML = `
        <h2>Game Over!</h2>
        <p>Score: ${Math.floor(score)}</p>
      `;

        // Create play again button
        this.playAgainButton = document.createElement('button');
        this.playAgainButton.id = 'playAgainButton';
        this.playAgainButton.innerText = 'Play Again';
        this.applyButtonStyles();
        this.container.appendChild(this.playAgainButton);

        // Add to DOM
        document.body.appendChild(this.container);

        // Setup event listener
        this.setupEventListeners(onPlayAgain);
    }

    /**
     * Applies styles to the game over container.
     */
    private applyContainerStyles(): void {
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            zIndex: '3000', // Above all other elements
        });
    }

    /**
     * Applies styles to the play again button.
     */
    private applyButtonStyles(): void {
        Object.assign(this.playAgainButton.style, {
            padding: '10px 20px',
            marginTop: '10px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: '#00ff00',
            border: '2px solid #00ff00',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontFamily: "'Press Start 2P', cursive",
        });
    }

    /**
     * Sets up event listeners for the play again button.
     * @param onPlayAgain Callback to trigger game reset
     */
    private setupEventListeners(onPlayAgain: () => void): void {
        this.playAgainButton.addEventListener('mouseover', () => {
            this.playAgainButton.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            this.playAgainButton.style.transform = 'scale(1.05)';
        });

        this.playAgainButton.addEventListener('mouseout', () => {
            this.playAgainButton.style.backgroundColor = 'transparent';
            this.playAgainButton.style.transform = 'scale(1)';
        });

        this.playAgainButton.addEventListener('click', () => {
            this.remove();
            onPlayAgain();
        });
    }

    /**
     * Removes the game over screen from the DOM.
     */
    remove(): void {
        this.container.remove();
    }
}