import type { PlayerInput } from './multiplayerTypes';

/**
 * Production-grade input validator
 * Ensures input is safe and valid before processing
 */
export class InputValidator {
  private lastInputTime: number = 0;
  private inputThrottleMs: number = 16; // ~60 FPS
  private consecutiveInvalidInputs: number = 0;
  private maxConsecutiveInvalid: number = 10;

  /**
   * Validate and sanitize player input
   */
  validate(input: unknown): PlayerInput | null {
    try {
      // Type check
      if (!input || typeof input !== 'object') {
        this.recordInvalidInput();
        return null;
      }

      const inp = input as any;

      // Validate required fields
      if (typeof inp.x !== 'number' || typeof inp.y !== 'number' || typeof inp.fire !== 'boolean') {
        this.recordInvalidInput();
        return null;
      }

      // Validate ranges
      if (inp.x < -1.5 || inp.x > 1.5 || inp.y < -1.5 || inp.y > 1.5) {
        console.warn('[Input] Out of range input:', inp.x, inp.y);
        this.recordInvalidInput();
        return null;
      }

      // Normalize to expected range
      const normalized: PlayerInput = {
        x: Math.max(-1, Math.min(1, inp.x)),
        y: Math.max(-1, Math.min(1, inp.y)),
        fire: Boolean(inp.fire),
        timestamp: Date.now(),
      };

      this.consecutiveInvalidInputs = 0;
      return normalized;
    } catch (error) {
      console.error('[Input] Validation error:', error);
      this.recordInvalidInput();
      return null;
    }
  }

  /**
   * Check if too many invalid inputs received
   */
  hasTooManyInvalidInputs(): boolean {
    return this.consecutiveInvalidInputs > this.maxConsecutiveInvalid;
  }

  /**
   * Reset invalid input counter
   */
  resetInvalidCounter(): void {
    this.consecutiveInvalidInputs = 0;
  }

  /**
   * Check if input should be throttled (not sent too frequently)
   */
  canSendInput(): boolean {
    const now = Date.now();
    if (now - this.lastInputTime >= this.inputThrottleMs) {
      this.lastInputTime = now;
      return true;
    }
    return false;
  }

  /**
   * Batch validate multiple inputs
   */
  validateBatch(inputs: unknown[]): PlayerInput[] {
    if (!Array.isArray(inputs)) {
      return [];
    }

    return inputs
      .map(inp => this.validate(inp))
      .filter((inp): inp is PlayerInput => inp !== null);
  }

  /**
   * Check if input is idle (no movement, no fire)
   */
  isIdle(input: PlayerInput): boolean {
    return input.x === 0 && input.y === 0 && !input.fire;
  }

  private recordInvalidInput(): void {
    this.consecutiveInvalidInputs++;
    if (this.consecutiveInvalidInputs > 5) {
      console.warn(`[Input] High number of invalid inputs: ${this.consecutiveInvalidInputs}`);
    }
  }
}

export const createInputValidator = (): InputValidator => {
  return new InputValidator();
};

