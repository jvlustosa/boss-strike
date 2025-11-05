/**
 * Production-grade User Manager
 * Handles user authentication, storage, and persistence
 */

export interface User {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
  stats: {
    gamesPlayed: number;
    maxLevel: number;
    totalScore: number;
    longestGame: number; // seconds
  };
}

class UserManager {
  private currentUser: User | null = null;
  private storageKey = 'boss_strike_user';
  private statsKey = 'boss_strike_stats';

  /**
   * Create or load user
   */
  init(): User {
    const stored = this.loadFromStorage();
    if (stored) {
      this.currentUser = stored;
      console.log(`[UserManager] Loaded user: ${stored.name}`);
      return stored;
    }

    // Create new guest user
    const newUser = this.createUser(`Player_${Math.random().toString(36).substring(7).toUpperCase()}`);
    this.saveToStorage(newUser);
    this.currentUser = newUser;
    console.log(`[UserManager] Created new user: ${newUser.name}`);
    return newUser;
  }

  /**
   * Create user with custom name
   */
  createUser(name: string): User {
    if (!name || name.length < 2) {
      throw new Error('User name must be at least 2 characters');
    }

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        maxLevel: 1,
        totalScore: 0,
        longestGame: 0,
      },
    };

    this.currentUser = user;
    this.saveToStorage(user);
    console.log(`[UserManager] Created user: ${user.name}`);
    return user;
  }

  /**
   * Set custom user name (login)
   */
  setUserName(name: string): User {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    if (!name || name.length < 2) {
      throw new Error('User name must be at least 2 characters');
    }

    this.currentUser.name = name.trim();
    this.currentUser.lastPlayedAt = Date.now();
    this.saveToStorage(this.currentUser);
    console.log(`[UserManager] Updated user name: ${name}`);
    return this.currentUser;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user or create new
   */
  getOrCreateUser(): User {
    if (this.currentUser) {
      return this.currentUser;
    }
    return this.init();
  }

  /**
   * Update game stats
   */
  updateStats(stats: Partial<User['stats']>): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    this.currentUser.stats = {
      ...this.currentUser.stats,
      ...stats,
    };

    this.currentUser.lastPlayedAt = Date.now();
    this.saveToStorage(this.currentUser);
    console.log(`[UserManager] Updated stats:`, stats);
  }

  /**
   * Record game play
   */
  recordGamePlay(level: number, score: number, duration: number): void {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    this.currentUser.stats.gamesPlayed++;
    this.currentUser.stats.totalScore += score;
    this.currentUser.stats.maxLevel = Math.max(this.currentUser.stats.maxLevel, level);
    this.currentUser.stats.longestGame = Math.max(this.currentUser.stats.longestGame, duration);
    this.currentUser.lastPlayedAt = Date.now();

    this.saveToStorage(this.currentUser);
    console.log(`[UserManager] Game recorded - Level: ${level}, Score: ${score}, Duration: ${duration}s`);
  }

  /**
   * Get user stats
   */
  getStats(): User['stats'] | null {
    return this.currentUser?.stats || null;
  }

  /**
   * Reset user (delete account)
   */
  resetUser(): void {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.statsKey);
    console.log('[UserManager] User reset');
  }

  /**
   * Export user data
   */
  exportData(): string {
    if (!this.currentUser) {
      throw new Error('No current user');
    }
    return JSON.stringify(this.currentUser, null, 2);
  }

  /**
   * Import user data
   */
  importData(jsonData: string): User {
    try {
      const user = JSON.parse(jsonData) as User;
      if (!user.id || !user.name || !user.stats) {
        throw new Error('Invalid user data format');
      }
      this.currentUser = user;
      this.saveToStorage(user);
      console.log(`[UserManager] Imported user: ${user.name}`);
      return user;
    } catch (error) {
      console.error('[UserManager] Import failed:', error);
      throw new Error('Invalid user data');
    }
  }

  private saveToStorage(user: User): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch (error) {
      console.warn('[UserManager] Could not save to storage:', error);
    }
  }

  private loadFromStorage(): User | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch (error) {
      console.warn('[UserManager] Could not load from storage:', error);
    }
    return null;
  }
}

export const userManager = new UserManager();
export const createUserManager = (): UserManager => userManager;

