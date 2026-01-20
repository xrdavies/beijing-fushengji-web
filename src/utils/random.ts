/**
 * Random number utilities
 */

/**
 * Generate random integer in range [0, max)
 *
 * @param max - Upper bound (exclusive)
 * @returns Random integer from 0 to max-1
 */
export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Generate random integer in range [min, max]
 *
 * @param min - Lower bound (inclusive)
 * @param max - Upper bound (inclusive)
 * @returns Random integer from min to max
 */
export function randomRange(min: number, max: number): number {
  return min + randomInt(max - min + 1);
}

/**
 * Generate random float in range [0, 1)
 */
export function randomFloat(): number {
  return Math.random();
}

/**
 * Pick random element from array
 */
export function randomChoice<T>(array: T[]): T {
  return array[randomInt(array.length)];
}

/**
 * Shuffle array in place (Fisher-Yates algorithm)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
