// src/components/ui/StartButton.ts

import { WalletService } from '../../services/WalletService';
import { CreditsDisplay } from './CreditsDisplay';

export class StartButton {
  private button: HTMLButtonElement;
  private instructionText: HTMLDivElement;
  private wallet: WalletService;
  private creditsDisplay: CreditsDisplay;
  private onStart: (token: string) => void;

  constructor(wallet: WalletService, creditsDisplay: CreditsDisplay, onStart: (token: string) => void, isUnlocked: boolean = false) {
    this.wallet = wallet;
    this.creditsDisplay = creditsDisplay;
    this.onStart = onStart;

    // Create the start button
    this.button = document.createElement('button');
    this.button.id = 'startGameButton';
    this.button.innerText = 'Insert Coins';
    this.button.disabled = true; // Initially disabled until wallet connects
    this.button.title = 'Connect wallet first to enable';
    this.applyButtonStyles();

    // Create instruction text
    this.instructionText = document.createElement('div');
    this.instructionText.id = 'gameInstructions';
    this.instructionText.innerHTML = 'Step 1: Connect wallet in top right<br>Step 2: Insert coins to play';
    this.applyInstructionStyles();

    if (isUnlocked) {
      this.enable();
    }

    // Append to DOM
    document.body.appendChild(this.instructionText);
    document.body.appendChild(this.button);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Applies styles to the start button.
   */
  private applyButtonStyles(): void {
    Object.assign(this.button.style, {
      position: 'fixed',
      bottom: '50px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '0.5rem 1rem',
      fontSize: '0.8rem',
      backgroundColor: 'transparent',
      color: '#00ff00',
      border: '2px solid #00ff00',
      borderRadius: '8px',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      zIndex: '2000',
      transition: 'all 0.3s',
      fontFamily: "'Press Start 2P', cursive",
    });
  }

  /**
   * Applies styles to the instruction text.
   */
  private applyInstructionStyles(): void {
    Object.assign(this.instructionText.style, {
      position: 'fixed',
      bottom: '110px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#ff9900', // Orange to indicate action needed
      fontSize: '18px',
      textAlign: 'center',
      zIndex: '2000',
    });
  }

  /**
   * Sets up event listeners for hover and click interactions.
   */
  private setupEventListeners(): void {
    // Hover effects (only when enabled)
    this.button.addEventListener('mouseover', () => {
      if (!this.button.disabled) {
        this.button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        this.button.style.transform = 'translateX(-50%) scale(1.05)';
      }
    });

    this.button.addEventListener('mouseout', () => {
      if (!this.button.disabled) {
        this.button.style.backgroundColor = 'transparent';
        this.button.style.transform = 'translateX(-50%)';
      }
    });

    // Click handler for starting the game
    this.button.addEventListener('click', async () => {
      if (this.button.disabled) return;

      try {
        this.button.disabled = true; // Prevent multiple clicks
        this.button.innerText = 'Processing...';
        this.button.style.backgroundColor = '#666666';

        const paymentResult = await this.wallet.makePayment();
        if (paymentResult) {
          this.creditsDisplay.update(paymentResult.credits);
          this.onStart(paymentResult.token);
          this.remove(); // Remove button and instructions after successful payment
        } else {
          this.showErrorState('Payment Failed');
        }
      } catch (error) {
        console.error('[StartButton] Failed to process payment:', error);
        this.showErrorState('Payment Failed');
      }
    });
  }

  /**
   * Temporarily displays an error state and resets the button.
   * @param message The error message to display
   */
  private showErrorState(message: string): void {
    this.button.innerText = message;
    this.button.style.backgroundColor = '#ff3333';

    setTimeout(() => {
      this.button.innerText = 'Insert Coins';
      this.button.style.backgroundColor = '#00aaff';
      this.button.disabled = false;
    }, 2000);
  }

  /**
   * Enables the button after wallet connection.
   */
  enable(): void {
    this.button.disabled = false;
    this.button.style.opacity = '1';
    this.button.style.cursor = 'pointer';
    this.button.title = 'Click to start the game';
    // this.instructionText.innerHTML = 'Step 1: ✅ Wallet Connected<br>Step 2: Click Insert Coins to play';
    this.instructionText.style.color = '#00cc66'; // Green to indicate progress
  }

  /**
   * Removes the button and instruction text from the DOM.
   */
  remove(): void {
    this.button.remove();
    this.instructionText.remove();
  }
}