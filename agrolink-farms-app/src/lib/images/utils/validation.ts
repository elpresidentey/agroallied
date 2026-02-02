/**
 * Validation utilities for the Image Integration System
 * This file will be implemented in later tasks
 */

import { ImageResult, SearchOptions } from '../types';

export class ImageValidation {
  static validateSearchOptions(options: SearchOptions): boolean {
    return options.count > 0 && options.count <= 50;
  }

  static validateImageResult(image: ImageResult): boolean {
    return !!(image.id && image.url && image.attribution);
  }

  static validateImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
}