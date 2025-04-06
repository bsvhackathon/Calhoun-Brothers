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
        padding: '0.5rem 1rem',
        fontSize: '0.8rem',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#00ff00',
        border: '2px solid #00ff00',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        zIndex: '2000',
        fontWeight: 'bold',
        fontFamily: "'Press Start 2P', cursive",
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