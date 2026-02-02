/**
 * CategoryMatcher - Maps application contexts to search terms
 * Handles agricultural keyword mapping and search term generation
 */

import { CategoryMatcher as ICategoryMatcher, ImageResult, CategoryMapping } from '../types';

export class CategoryMatcher implements ICategoryMatcher {
  private readonly categoryMappings: CategoryMapping[] = [
    {
      category: 'livestock',
      primaryTerms: ['cattle', 'cows', 'livestock', 'farm animals', 'dairy cows', 'beef cattle'],
      fallbackTerms: ['agriculture', 'farming', 'rural', 'pasture', 'ranch'],
      excludeTerms: ['wild animals', 'zoo', 'pets']
    },
    {
      category: 'crops',
      primaryTerms: ['crops', 'wheat', 'corn', 'soybeans', 'harvest', 'grain fields', 'crop farming'],
      fallbackTerms: ['agriculture', 'farming', 'fields', 'rural landscape'],
      excludeTerms: ['garden', 'flowers', 'decorative plants']
    },
    {
      category: 'poultry',
      primaryTerms: ['chickens', 'poultry', 'farm chickens', 'egg production', 'chicken coop', 'free range chickens'],
      fallbackTerms: ['farm animals', 'agriculture', 'farming', 'rural'],
      excludeTerms: ['wild birds', 'pets', 'exotic birds']
    },
    {
      category: 'dairy',
      primaryTerms: ['dairy farm', 'milk production', 'dairy cows', 'milking', 'dairy farming', 'cow milking'],
      fallbackTerms: ['cattle', 'cows', 'agriculture', 'farming', 'rural'],
      excludeTerms: ['wild animals', 'beef cattle']
    },
    {
      category: 'vegetables',
      primaryTerms: ['vegetable farming', 'vegetable crops', 'tomatoes', 'lettuce', 'carrots', 'farm vegetables'],
      fallbackTerms: ['agriculture', 'farming', 'crops', 'harvest', 'fields'],
      excludeTerms: ['wild plants', 'decorative plants', 'flowers']
    },
    {
      category: 'fruits',
      primaryTerms: ['fruit farming', 'orchard', 'apple trees', 'fruit harvest', 'agricultural fruits', 'farm fruits'],
      fallbackTerms: ['agriculture', 'farming', 'trees', 'harvest', 'rural'],
      excludeTerms: ['wild fruits', 'decorative trees', 'forest']
    },
    {
      category: 'equipment',
      primaryTerms: ['farm equipment', 'tractor', 'agricultural machinery', 'farming tools', 'harvester', 'plow'],
      fallbackTerms: ['agriculture', 'farming', 'rural', 'machinery'],
      excludeTerms: ['construction equipment', 'industrial machinery']
    },
    {
      category: 'general',
      primaryTerms: ['agriculture', 'farming', 'farm', 'rural landscape', 'agricultural land', 'countryside'],
      fallbackTerms: ['rural', 'landscape', 'fields', 'nature'],
      excludeTerms: ['urban', 'city', 'industrial']
    }
  ];

  private readonly heroThemes: string[] = [
    'beautiful farm landscape',
    'golden wheat fields',
    'pastoral countryside',
    'agricultural sunrise',
    'green farmland',
    'rural farming scene',
    'harvest season',
    'farm at sunset',
    'agricultural valley',
    'farming community'
  ];

  private readonly globalFallbackTerms: string[] = [
    'agriculture',
    'farming',
    'rural',
    'countryside',
    'farm',
    'agricultural landscape',
    'pastoral',
    'farmland'
  ];

  private readonly agriculturalKeywords: Set<string> = new Set([
    'agriculture', 'farming', 'farm', 'rural', 'countryside', 'pastoral',
    'livestock', 'cattle', 'cows', 'dairy', 'beef', 'poultry', 'chickens',
    'crops', 'wheat', 'corn', 'soybeans', 'vegetables', 'fruits', 'harvest',
    'fields', 'pasture', 'orchard', 'barn', 'silo', 'tractor', 'plow',
    'agricultural', 'farmland', 'ranch', 'grazing', 'cultivation'
  ]);

  getSearchTerms(category: string): string[] {
    const normalizedCategory = category.toLowerCase().trim();
    
    // Find exact category match
    const mapping = this.categoryMappings.find(m => m.category === normalizedCategory);
    if (mapping) {
      return [...mapping.primaryTerms];
    }

    // Try partial matches for compound categories
    const partialMatch = this.categoryMappings.find(m => 
      normalizedCategory.includes(m.category) || m.category.includes(normalizedCategory)
    );
    if (partialMatch) {
      return [...partialMatch.primaryTerms];
    }

    // Return general agricultural terms for unknown categories
    const generalMapping = this.categoryMappings.find(m => m.category === 'general');
    return generalMapping ? [...generalMapping.primaryTerms] : [...this.globalFallbackTerms];
  }

  getHeroThemes(): string[] {
    return [...this.heroThemes];
  }

  getFallbackTerms(): string[] {
    return [...this.globalFallbackTerms];
  }

  validateImageRelevance(image: ImageResult, category: string): boolean {
    const normalizedCategory = category.toLowerCase().trim();
    
    // Get the category mapping for validation
    const mapping = this.categoryMappings.find(m => m.category === normalizedCategory);
    
    // Check image tags and description for agricultural relevance
    const imageText = [
      image.altText?.toLowerCase() || '',
      image.metadata.tags.join(' ').toLowerCase(),
      ...(image.metadata.tags || [])
    ].join(' ').toLowerCase();

    // Check for excluded terms first
    if (mapping?.excludeTerms.some(term => imageText.includes(term.toLowerCase()))) {
      return false;
    }

    // Check for primary terms (highest relevance)
    if (mapping?.primaryTerms.some(term => imageText.includes(term.toLowerCase()))) {
      return true;
    }

    // Check for fallback terms (moderate relevance)
    if (mapping?.fallbackTerms.some(term => imageText.includes(term.toLowerCase()))) {
      return true;
    }

    // Check for general agricultural keywords
    const hasAgriculturalKeywords = Array.from(this.agriculturalKeywords).some(keyword =>
      imageText.includes(keyword.toLowerCase())
    );

    return hasAgriculturalKeywords;
  }

  /**
   * Get category mapping for a specific category
   */
  getCategoryMapping(category: string): CategoryMapping | undefined {
    const normalizedCategory = category.toLowerCase().trim();
    return this.categoryMappings.find(m => m.category === normalizedCategory);
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    return this.categoryMappings.map(m => m.category);
  }

  /**
   * Get search terms with fallbacks for failed queries
   */
  getSearchTermsWithFallbacks(category: string): string[][] {
    const normalizedCategory = category.toLowerCase().trim();
    const mapping = this.categoryMappings.find(m => m.category === normalizedCategory);
    
    if (mapping) {
      return [
        mapping.primaryTerms,
        mapping.fallbackTerms,
        this.globalFallbackTerms
      ];
    }

    // For unknown categories, return general terms
    const generalMapping = this.categoryMappings.find(m => m.category === 'general');
    return [
      generalMapping?.primaryTerms || this.globalFallbackTerms,
      this.globalFallbackTerms
    ];
  }

  /**
   * Get next fallback search terms when a query fails
   */
  getNextFallbackTerms(category: string, currentAttempt: number): string[] {
    const fallbackLevels = this.getSearchTermsWithFallbacks(category);
    
    if (currentAttempt < fallbackLevels.length) {
      return fallbackLevels[currentAttempt];
    }
    
    // Final fallback - return most general terms
    return this.globalFallbackTerms;
  }

  /**
   * Validate image theme for agricultural content
   */
  validateImageTheme(image: ImageResult): boolean {
    const imageText = [
      image.altText?.toLowerCase() || '',
      image.metadata.tags.join(' ').toLowerCase(),
      ...(image.metadata.tags || [])
    ].join(' ').toLowerCase();

    // Check for any agricultural keywords
    const hasAgriculturalContent = Array.from(this.agriculturalKeywords).some(keyword =>
      imageText.includes(keyword.toLowerCase())
    );

    // Check for non-agricultural content that should be excluded
    const nonAgriculturalTerms = [
      'urban', 'city', 'industrial', 'factory', 'office', 'building',
      'technology', 'computer', 'digital', 'abstract', 'portrait',
      'fashion', 'sports', 'entertainment', 'music', 'art gallery'
    ];

    const hasNonAgriculturalContent = nonAgriculturalTerms.some(term =>
      imageText.includes(term.toLowerCase())
    );

    return hasAgriculturalContent && !hasNonAgriculturalContent;
  }

  /**
   * Get relevance score for an image based on category
   */
  getImageRelevanceScore(image: ImageResult, category: string): number {
    const normalizedCategory = category.toLowerCase().trim();
    const mapping = this.categoryMappings.find(m => m.category === normalizedCategory);
    
    const imageText = [
      image.altText?.toLowerCase() || '',
      image.metadata.tags.join(' ').toLowerCase(),
      ...(image.metadata.tags || [])
    ].join(' ').toLowerCase();

    let score = 0;

    // Check for excluded terms (negative score)
    if (mapping?.excludeTerms.some(term => imageText.includes(term.toLowerCase()))) {
      return -1; // Exclude this image
    }

    // Primary terms get highest score
    const primaryMatches = mapping?.primaryTerms.filter(term => 
      imageText.includes(term.toLowerCase())
    ).length || 0;
    score += primaryMatches * 3;

    // Fallback terms get medium score
    const fallbackMatches = mapping?.fallbackTerms.filter(term => 
      imageText.includes(term.toLowerCase())
    ).length || 0;
    score += fallbackMatches * 2;

    // General agricultural keywords get low score
    const agriculturalMatches = Array.from(this.agriculturalKeywords).filter(keyword =>
      imageText.includes(keyword.toLowerCase())
    ).length;
    score += agriculturalMatches * 1;

    return score;
  }

  /**
   * Filter and sort images by relevance to category
   */
  filterAndSortByRelevance(images: ImageResult[], category: string): ImageResult[] {
    return images
      .map(image => ({
        image,
        score: this.getImageRelevanceScore(image, category)
      }))
      .filter(item => item.score > 0) // Exclude negative scores
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map(item => item.image);
  }

  /**
   * Generate search query variations for better results
   */
  generateSearchVariations(baseTerms: string[]): string[] {
    const variations: string[] = [];
    
    // Add base terms
    variations.push(...baseTerms);
    
    // Add combinations with "farm" or "agricultural"
    baseTerms.forEach(term => {
      if (!term.includes('farm') && !term.includes('agricultural')) {
        variations.push(`farm ${term}`);
        variations.push(`agricultural ${term}`);
      }
    });
    
    // Add seasonal variations
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    baseTerms.slice(0, 2).forEach(term => { // Only for first 2 terms to avoid too many variations
      seasons.forEach(season => {
        variations.push(`${season} ${term}`);
      });
    });
    
    return [...new Set(variations)]; // Remove duplicates
  }
}