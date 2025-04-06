import config from '../config/config';

export interface PastLottery {
  _id?: string;
  id: number;
  date: string;
  participants: number;
  winner: string;
  prize: number;
  transactions: Array<{
    identity: string;
    gameScore: number;
    createdAt: string;
    nonce: string;
  }>;
  winningIdentityKey: string;
}

export class LotteryService {
  /**
   * Fetches completed lotteries from the server
   * @returns Promise resolving to an array of PastLottery objects
   */
  async getCompletedLotteries(): Promise<PastLottery[]> {
    try {
      const response = await fetch(`${config.API_URL}/completed-lotteries`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch completed lotteries: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[LotteryService] Failed to fetch completed lotteries:', error);
      return [];
    }
  }

  /**
   * Fetches the current queue from the server
   * @returns Promise resolving to an array of player addresses
   */
  async getCurrentQueue(): Promise<string[]> {
    try {
      const response = await fetch(`${config.API_URL}/queue`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch current queue: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[LotteryService] Failed to fetch current queue:', error);
      return [];
    }
  }

  /**
   * Fetches upcoming/unfinished lotteries from the server
   * @returns Promise resolving to an array of PastLottery objects
   */
  async getUpcomingLotteries(): Promise<PastLottery[]> {
    try {
      const response = await fetch(`${config.API_URL}/unfinished-lotteries`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch upcoming lotteries: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[LotteryService] Failed to fetch upcoming lotteries:', error);
      return [];
    }
  }
} 