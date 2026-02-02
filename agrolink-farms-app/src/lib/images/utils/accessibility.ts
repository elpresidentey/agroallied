/**
 * Accessibility utilities for image components
 * Provides enhanced alt text generation and accessibility features
 */

import { ImageResult, ImageMetadata } from '../types';

export class AccessibilityHelper {
  /**
   * Generate descriptive alt text for images
   */
  static generateAltText(image: ImageResult, context?: string): string {
    const { altText, metadata } = image;
    
    // Use existing alt text if available and descriptive
    if (altText && altText.length > 10 && !this.isGenericAltText(altText)) {
      return this.enhanceAltText(altText, context);
    }

    // Generate alt text from metadata
    return this.generateFromMetadata(image, context);
  }

  /**
   * Check if alt text is generic/unhelpful
   */
  private static isGenericAltText(altText: string): boolean {
    const genericTerms = [
      'image', 'photo', 'picture', 'untitled', 'img', 'dsc', 'screenshot',
      'download', 'upload', 'file', 'document'
    ];
    
    const lowerAlt = altText.toLowerCase();
    return genericTerms.some(term => lowerAlt.includes(term)) && altText.length < 20;
  }

  /**
   * Enhance existing alt text with context
   */
  private static enhanceAltText(altText: string, context?: string): string {
    if (!context) return altText;
    
    // Add context if not already present
    const lowerAlt = altText.toLowerCase();
    const lowerContext = context.toLowerCase();
    
    if (!lowerAlt.includes(lowerContext)) {
      return `${altText} - ${context}`;
    }
    
    return altText;
  }

  /**
   * Generate alt text from image metadata
   */
  private static generateFromMetadata(image: ImageResult, context?: string): string {
    const { metadata, source } = image;
    const parts: string[] = [];

    // Add context first
    if (context) {
      parts.push(this.formatContext(context));
    }

    // Add agricultural keywords from tags
    const agriculturalTags = this.extractAgriculturalTags(metadata.tags);
    if (agriculturalTags.length > 0) {
      parts.push(agriculturalTags.slice(0, 3).join(', '));
    } else {
      parts.push('agricultural scene');
    }

    // Add descriptive elements
    const description = this.generateDescription(metadata);
    if (description) {
      parts.push(description);
    }

    // Combine parts
    let altText = parts.join(' featuring ');
    
    // Ensure it's not too long
    if (altText.length > 125) {
      altText = altText.substring(0, 122) + '...';
    }

    return altText;
  }

  /**
   * Format context for alt text
   */
  private static formatContext(context: string): string {
    return context.charAt(0).toUpperCase() + context.slice(1).replace(/[-_]/g, ' ');
  }

  /**
   * Extract agricultural tags from metadata
   */
  private static extractAgriculturalTags(tags: string[]): string[] {
    const agriculturalKeywords = [
      'farm', 'farming', 'agriculture', 'agricultural', 'crop', 'crops',
      'livestock', 'cattle', 'cow', 'cows', 'dairy', 'beef', 'chicken',
      'chickens', 'poultry', 'pig', 'pigs', 'sheep', 'goat', 'goats',
      'horse', 'horses', 'tractor', 'barn', 'silo', 'field', 'fields',
      'pasture', 'meadow', 'harvest', 'planting', 'rural', 'countryside',
      'wheat', 'corn', 'soybean', 'soybeans', 'vegetable', 'vegetables',
      'fruit', 'fruits', 'orchard', 'vineyard', 'greenhouse'
    ];

    return tags.filter(tag => 
      agriculturalKeywords.some(keyword => 
        tag.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * Generate description from metadata
   */
  private static generateDescription(metadata: ImageMetadata): string {
    const { width, height, dominantColors } = metadata;
    const parts: string[] = [];

    // Add orientation
    if (width > height * 1.5) {
      parts.push('wide landscape view');
    } else if (height > width * 1.5) {
      parts.push('vertical composition');
    } else {
      parts.push('balanced composition');
    }

    // Add color information
    if (dominantColors && dominantColors.length > 0) {
      const colorDescription = this.describeColors(dominantColors);
      if (colorDescription) {
        parts.push(`with ${colorDescription} tones`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Describe dominant colors in natural language
   */
  private static describeColors(colors: string[]): string {
    const colorMap: Record<string, string> = {
      '#008000': 'green',
      '#00ff00': 'bright green',
      '#90ee90': 'light green',
      '#006400': 'dark green',
      '#228b22': 'forest green',
      '#32cd32': 'lime green',
      '#8fbc8f': 'sage green',
      '#brown': 'brown',
      '#8b4513': 'saddle brown',
      '#a0522d': 'sienna brown',
      '#d2691e': 'chocolate brown',
      '#daa520': 'golden',
      '#ffd700': 'gold',
      '#ffff00': 'yellow',
      '#87ceeb': 'sky blue',
      '#4682b4': 'steel blue',
      '#ffffff': 'white',
      '#f5f5f5': 'off-white',
      '#000000': 'black',
      '#696969': 'gray'
    };

    // Convert hex colors to descriptions
    const descriptions = colors.slice(0, 2).map(color => {
      const lowerColor = color.toLowerCase();
      
      // Direct match
      if (colorMap[lowerColor]) {
        return colorMap[lowerColor];
      }

      // Approximate match for green tones (common in agriculture)
      if (lowerColor.includes('green') || this.isGreenish(color)) {
        return 'green';
      }
      
      if (lowerColor.includes('brown') || this.isBrownish(color)) {
        return 'brown';
      }
      
      if (lowerColor.includes('blue') || this.isBluish(color)) {
        return 'blue';
      }

      return null;
    }).filter(Boolean) as string[];

    if (descriptions.length === 0) return '';
    if (descriptions.length === 1) return descriptions[0]!;
    
    return descriptions.join(' and ');
  }

  /**
   * Check if color is greenish
   */
  private static isGreenish(color: string): boolean {
    if (!color.startsWith('#')) return false;
    
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    return g > r && g > b && g > 100;
  }

  /**
   * Check if color is brownish
   */
  private static isBrownish(color: string): boolean {
    if (!color.startsWith('#')) return false;
    
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    return r > 100 && g > 50 && b < 100 && r > g && r > b;
  }

  /**
   * Check if color is bluish
   */
  private static isBluish(color: string): boolean {
    if (!color.startsWith('#') || color.length !== 7) return false;
    
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    return b > r && b > g && b > 100;
  }

  /**
   * Generate ARIA label for interactive image elements
   */
  static generateAriaLabel(image: ImageResult, context?: string, interactive?: boolean): string {
    const altText = this.generateAltText(image, context);
    
    if (!interactive) return altText;
    
    return `${altText}. Click to view larger image or more details.`;
  }

  /**
   * Generate role and ARIA attributes for image containers
   */
  static getAccessibilityProps(image: ImageResult, interactive: boolean = false): Record<string, string> {
    const props: Record<string, string> = {};
    
    if (interactive) {
      props.role = 'button';
      props.tabIndex = '0';
      props['aria-label'] = this.generateAriaLabel(image, undefined, true);
    }
    
    return props;
  }

  /**
   * Validate alt text quality
   */
  static validateAltText(altText: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check length
    if (altText.length < 10) {
      issues.push('Alt text is too short');
      suggestions.push('Add more descriptive details about the image content');
    }
    
    if (altText.length > 125) {
      issues.push('Alt text is too long');
      suggestions.push('Shorten to focus on the most important elements');
    }

    // Check for generic terms
    if (this.isGenericAltText(altText)) {
      issues.push('Alt text appears to be generic');
      suggestions.push('Use more specific, descriptive language');
    }

    // Check for redundant phrases
    const redundantPhrases = ['image of', 'picture of', 'photo of', 'graphic of'];
    if (redundantPhrases.some(phrase => altText.toLowerCase().includes(phrase))) {
      issues.push('Contains redundant phrases');
      suggestions.push('Remove phrases like "image of" or "picture of"');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}