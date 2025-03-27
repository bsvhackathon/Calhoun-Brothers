// src/services/WalletService.ts

import { WalletClient, AuthFetch } from '@bsv/sdk';
import config from '../config/config';

export class WalletService {
  private wallet: WalletClient | null = null;
  private credits: number = 0;

  constructor() {
    // Initialize wallet client lazily in connect() method
  }

  /**
   * Connects to the wallet and authenticates the user.
   * @param provider The wallet provider (e.g., 'json-api')
   * @param host The host for the wallet service (e.g., 'localhost')
   * @returns Promise resolving to boolean indicating if authentication succeeded
   */
  async connect(provider: 'auto' | 'Cicada' | 'XDM' | 'window.CWI' | 'json-api' = 'json-api', host: string = 'localhost'): Promise<boolean> {
    try {
      if (!this.wallet) {
        this.wallet = await new WalletClient(provider, host);
      }

      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        // Attempt to get public key to trigger authentication if needed
        await this.wallet.getPublicKey({ identityKey: true });
      }

      // Fetch initial credits after successful authentication
      if (await this.isAuthenticated()) {
        await this.fetchCredits();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[WalletService] Failed to connect to wallet:', error);
      this.wallet = null; // Reset on failure
      return false;
    }
  }

  /**
   * Checks if the wallet is authenticated.
   * @returns Promise resolving to boolean indicating authentication status
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      if (!this.wallet) return false;
      const authResult = await this.wallet.isAuthenticated();
      return !!authResult && typeof authResult === 'object' && authResult.authenticated === true;
    } catch (error) {
      console.error('[WalletService] Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Fetches the user's current credits from the wallet or server.
   * @returns Promise resolving to the number of credits
   */
  async fetchCredits(): Promise<number> {
    try {
      if (await this.isAuthenticated()) {
        // Placeholder: In a real app, this might fetch from a server API
        // For now, we'll simulate it since the original code set it to 0
        this.credits = 0; // Replace with actual API call if available
        return this.credits;
      }
      return 0;
    } catch (error) {
      console.error('[WalletService] Failed to fetch credits:', error);
      return 0;
    }
  }

  /**
   * Initiates a payment request to the server.
   * @returns Promise resolving to an object with token and updated credits, or null on failure
   */
  async makePayment(): Promise<{ token: string; credits: number } | null> {
    try {
      if (!this.wallet || !await this.isAuthenticated()) {
        throw new Error('Wallet not authenticated');
      }

      const client = await new AuthFetch(this.wallet);
      const response = await client.fetch(`${config.PAYMENT_API_URL}/pay`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.token) {
        this.credits = data.credits !== undefined ? data.credits : this.credits;
        return { token: data.token, credits: this.credits };
      }

      throw new Error('Invalid payment response: missing token');
    } catch (error) {
      console.error('[WalletService] Payment failed:', error);
      return null;
    }
  }

  /**
   * Gets the current number of credits.
   * @returns The current credits value
   */
  getCredits(): number {
    return this.credits;
  }

  /**
   * Updates the credits value (e.g., from server data).
   * @param credits The new credits value
   */
  updateCredits(credits: number): void {
    this.credits = credits;
  }

  /**
   * Disconnects the wallet (resets the instance).
   */
  disconnect(): void {
    this.wallet = null;
    this.credits = 0;
  }
}