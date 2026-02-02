# Image Integration System

A comprehensive solution for dynamically fetching, caching, and displaying agricultural-themed images throughout the AgroLink farms application.

## Directory Structure

```
src/lib/images/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript interfaces and types
├── config.ts                   # Configuration management
├── README.md                   # This file
├── services/                   # Core business logic services
│   ├── index.ts
│   ├── image-service.ts        # Main orchestration service
│   ├── category-matcher.ts     # Category to search term mapping
│   ├── image-cache.ts          # Local image caching
│   └── attribution-manager.ts  # Attribution and compliance
├── adapters/                   # External API integrations
│   ├── index.ts
│   ├── image-api-adapter.ts    # Base adapter interface
│   ├── unsplash-adapter.ts     # Unsplash API integration
│   └── pexels-adapter.ts       # Pexels API integration
├── utils/                      # Utility functions
│   ├── index.ts
│   ├── error-handler.ts        # Error handling utilities
│   ├── image-utils.ts          # Image processing utilities
│   └── validation.ts           # Validation functions
├── components/                 # React components
│   ├── index.ts
│   ├── hero-image.tsx          # Hero section image component
│   ├── category-image.tsx      # Category-specific images
│   └── section-background.tsx  # Section background images
└── __tests__/                  # Test utilities and mocks
    ├── index.ts
    ├── test-utils.ts           # Testing utilities
    └── mock-data.ts            # Mock data for tests
```

## Implementation Status

This is the initial project structure setup (Task 1). The following components are created but not yet implemented:

### ✅ Completed (Task 1)
- [x] Directory structure
- [x] Core TypeScript interfaces and types
- [x] Configuration management system
- [x] Environment variable documentation
- [x] Placeholder service files

### 🚧 Pending Implementation
- [ ] Task 2: ImageService and error handling
- [ ] Task 3: API adapter layer (Unsplash/Pexels)
- [ ] Task 5: CategoryMatcher and search logic
- [ ] Task 6: Caching system
- [ ] Task 7: Attribution management
- [ ] Task 9: React hero components
- [ ] Task 10: Landing page image components
- [ ] Task 11: Lazy loading and performance
- [ ] Task 12: Configuration and feature flags
- [ ] Task 13: Integration and wiring
- [ ] Task 14: Monitoring and logging
- [ ] Task 15: Final integration testing

## Configuration

The system uses environment variables for configuration. See `.env.local` for all available options:

### Required API Keys
- `UNSPLASH_ACCESS_KEY`: Get from [Unsplash Developers](https://unsplash.com/developers)
- `PEXELS_API_KEY`: Get from [Pexels API](https://www.pexels.com/api/)

### Optional Configuration
- Cache settings (size, TTL, eviction policy)
- Feature flags (enable/disable specific APIs or features)
- Performance settings (timeouts, retry attempts, concurrent requests)

## Usage

Once implemented, the system will be used like this:

```typescript
import { ImageService, getImageConfig } from '@/lib/images';

// Get a hero image
const imageService = new ImageService();
const heroImage = await imageService.getHeroImage('countryside');

// Use in React components
import { HeroImage } from '@/lib/images/components';

<HeroImage theme="farming" fallbackImage="/fallback.jpg" />
```

## Architecture

The system follows a service-oriented architecture with clear separation of concerns:

1. **ImageService**: Main orchestration layer
2. **CategoryMatcher**: Maps contexts to search terms
3. **ImageCache**: Handles local storage and retrieval
4. **API Adapters**: Abstract external API interactions
5. **AttributionManager**: Handles compliance and credits
6. **React Components**: UI layer for displaying images

## Testing

The system will include comprehensive testing:
- **Unit tests**: Specific examples and edge cases
- **Property-based tests**: Universal correctness properties
- **Integration tests**: End-to-end workflows
- **Performance tests**: Loading times and optimization

## Requirements Validation

This implementation addresses the following requirements:
- **Requirement 1.5**: Configuration through environment variables ✅
- **Requirement 8.1**: Support for API keys and settings ✅

## Next Steps

1. Implement Task 2: Core ImageService and error handling
2. Set up API adapters for Unsplash and Pexels (Task 3)
3. Continue with remaining tasks in sequence

For detailed implementation plans, see `.kiro/specs/image-integration/tasks.md`.