// src/components/ui/ConnectButton.ts

import { WalletService } from '../../services/WalletService';

export class ConnectButton {
  private button: HTMLButtonElement;
  private wallet: WalletService;
  private onConnected: () => void;

  constructor(wallet: WalletService, onConnected: () => void) {
    this.wallet = wallet;
    this.onConnected = onConnected;

    // Create the connect button
    this.button = document.createElement('button');
    this.button.id = 'connectWalletButton';
    this.button.innerText = 'Connect Wallet';
    this.applyStyles();
    this.setupEventListeners();
    document.body.appendChild(this.button);
  }

  /**
   * Applies initial and consistent styles to the button.
   */
  private applyStyles(): void {
    Object.assign(this.button.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '0.5rem 1rem',
      fontSize: '0.8rem',
      backgroundColor: 'transparent',
      color: '#00ff00',
      border: '2px solid #00ff00',
      borderRadius: '8px',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      zIndex: '2500',
      transition: 'all 0.3s',
      fontFamily: "'Press Start 2P', cursive",
    });
  }

  /**
   * Sets up event listeners for hover and click interactions.
   */
  private setupEventListeners(): void {
    // Hover effects
    this.button.addEventListener('mouseover', () => {
      this.button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
      this.button.style.transform = 'scale(1.05)';
    });

    this.button.addEventListener('mouseout', () => {
      this.button.style.backgroundColor = this.button.innerText === 'Wallet Connected' ? 'rgba(0, 255, 0, 0.2)' : 'transparent';
      this.button.style.transform = 'scale(1)';
    });

    // Click handler for wallet connection
    this.button.addEventListener('click', async () => {
      try {
        this.button.disabled = true; // Prevent multiple clicks
        this.button.innerText = 'Connecting...';
        this.button.style.backgroundColor = '#666666';

        const connected = await this.wallet.connect();
        if (connected) {
          this.button.innerText = 'Wallet Connected';
          this.button.style.backgroundColor = '#00cc66';
          this.onConnected(); // Notify GameClient of successful connection
        } else {
          this.showErrorState('Authentication Failed');
        }
      } catch (error) {
        console.error('[ConnectButton] Failed to connect wallet:', error);
        this.showErrorState('Connection Failed');
      } finally {
        this.button.disabled = false; // Re-enable button after attempt
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

    // Reset after 2 seconds
    setTimeout(() => {
      this.button.innerText = 'Connect Wallet';
      this.button.style.backgroundColor = '#00aaff';
    }, 2000);
  }

  /**
   * Removes the button from the DOM.
   */
  remove(): void {
    this.button.remove();
  }
}