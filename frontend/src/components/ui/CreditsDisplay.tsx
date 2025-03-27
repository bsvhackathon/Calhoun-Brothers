// src/components/ui/CreditsDisplay.ts

export class CreditsDisplay {
    private display: HTMLDivElement;
  
    constructor(initialCredits: number = 0) {
      // Create the credits display element
      this.display = document.createElement('div');
      this.display.id = 'creditsDisplay';
      this.display.textContent = `Credits: ${initialCredits}`;
      this.applyStyles();
      document.body.appendChild(this.display);
    }
  
    /**
     * Applies consistent styles to the credits display.
     */
    private applyStyles(): void {
      Object.assign(this.display.style, {
        position: 'fixed',
        bottom: '50px',
        right: '20px',
        padding: '15px 25px',
        fontSize: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#ffcc00', // Gold color for credits
        border: '2px solid #ffcc00',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        zIndex: '2000',
        fontWeight: 'bold',
      });
    }
  
    /**
     * Updates the displayed credits value.
     * @param credits The new credits value to display
     */
    update(credits: number): void {
      this.display.textContent = `Credits: ${credits}`;
    }
  
    /**
     * Removes the credits display from the DOM.
     */
    remove(): void {
      this.display.remove();
    }
  }