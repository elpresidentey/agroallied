/**
 * Image utility functions
 * This file will be implemented in later tasks
 */

export class ImageUtils {
  static calculateAspectRatio(width: number, height: number): number {
    return width / height;
  }

  static generateCacheKey(query: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${query}:${optionsStr}`;
  }

  static isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}