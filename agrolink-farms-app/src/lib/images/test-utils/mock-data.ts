/**
 * Mock data for testing image integration system
 */

import { CategoryMapping } from '../types';

export const MOCK_CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    category: 'livestock',
    primaryTerms: ['cattle', 'cows', 'livestock'],
    fallbackTerms: ['agriculture', 'farming'],
    excludeTerms: ['urban', 'city']
  },
  {
    category: 'crops',
    primaryTerms: ['crops', 'wheat', 'corn'],
    fallbackTerms: ['agriculture', 'farming'],
    excludeTerms: ['urban', 'city']
  }
];

export const MOCK_SEARCH_QUERIES = [
  'agriculture',
  'farming',
  'livestock',
  'crops',
  'tractor',
  'harvest'
];

export const MOCK_HERO_THEMES = [
  'rural landscape',
  'farm field',
  'countryside',
  'agricultural land'
];