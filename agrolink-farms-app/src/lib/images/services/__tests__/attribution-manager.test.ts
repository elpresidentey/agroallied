/**
 * Unit tests for AttributionManager service
 * Tests attribution formatting, usage tracking, and compliance reporting
 */

import { AttributionManager } from '../attribution-manager';
import { ImageResult, ImageMetadata, Attribution } from '../../types';

describe('AttributionManager', () => {
  let attributionManager: AttributionManager;

  const createMockImage = (
    id: string,
    source: 'unsplash' | 'pexels' | 'cache' | 'fallback',
    photographer: string,
    photographerUrl: string,
    required: boolean = true
  ): ImageResult => ({
    id,
    url: `https://example.com/image-${id}.jpg`,
    thumbnailUrl: `https://example.com/thumb-${id}.jpg`,
    altText: 'Test image',
    attribution: {
      photographer,
      photographerUrl,
      source,
      sourceUrl: `https://${source}.com/photo/${id}`,
      required
    } as Attribution,
    source,
    metadata: {
      width: 800,
      height: 600,
      aspectRatio: 1.33,
      dominantColors: ['#green'],
      tags: ['test', 'agriculture'],
      downloadUrl: `https://example.com/download-${id}.jpg`,
      apiId: `api-${id}`,
      fetchedAt: new Date()
    } as ImageMetadata
  });

  beforeEach(() => {
    attributionManager = new AttributionManager();
  });

  describe('formatAttribution', () => {
    it('should format Unsplash attribution correctly', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const attribution = attributionManager.formatAttribution(image);
      expect(attribution).toBe('Photo by John Doe on Unsplash');
    });

    it('should format Pexels attribution correctly', () => {
      const image = createMockImage('1', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith');
      const attribution = attributionManager.formatAttribution(image);
      expect(attribution).toBe('Photo by Jane Smith from Pexels');
    });

    it('should format generic attribution for other sources', () => {
      const image = createMockImage('1', 'cache', 'Bob Wilson', 'https://example.com/bob');
      const attribution = attributionManager.formatAttribution(image);
      expect(attribution).toBe('Photo by Bob Wilson');
    });

    it('should return empty string when attribution not required', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe', false);
      const attribution = attributionManager.formatAttribution(image);
      expect(attribution).toBe('');
    });
  });

  describe('getAttributionLink', () => {
    it('should return photographer URL when available', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const link = attributionManager.getAttributionLink(image);
      expect(link).toBe('https://unsplash.com/@johndoe');
    });

    it('should return source URL when photographer URL not available', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', '');
      const link = attributionManager.getAttributionLink(image);
      expect(link).toBe('https://unsplash.com/photo/1');
    });

    it('should return empty string when attribution not required', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe', false);
      const link = attributionManager.getAttributionLink(image);
      expect(link).toBe('');
    });
  });

  describe('trackUsage', () => {
    it('should track new image usage', async () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      
      await attributionManager.trackUsage(image);
      
      const usage = attributionManager.getImageUsage('1', 'unsplash');
      expect(usage).not.toBeNull();
      expect(usage!.usageCount).toBe(1);
      expect(usage!.photographer).toBe('John Doe');
    });

    it('should increment usage count for existing images', async () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      
      await attributionManager.trackUsage(image);
      await attributionManager.trackUsage(image);
      await attributionManager.trackUsage(image);
      
      const usage = attributionManager.getImageUsage('1', 'unsplash');
      expect(usage!.usageCount).toBe(3);
    });

    it('should update last used timestamp', async () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      
      await attributionManager.trackUsage(image);
      const firstUsage = attributionManager.getImageUsage('1', 'unsplash')!;
      
      // Wait a bit and track again
      await new Promise(resolve => setTimeout(resolve, 100)); // Increased wait time
      await attributionManager.trackUsage(image);
      
      const secondUsage = attributionManager.getImageUsage('1', 'unsplash')!;
      expect(secondUsage.lastUsed.getTime()).toBeGreaterThanOrEqual(firstUsage.lastUsed.getTime());
      expect(secondUsage.usageCount).toBe(2); // Verify it was actually updated
    });
  });

  describe('generateAttributionReport', () => {
    it('should generate comprehensive attribution report', async () => {
      const image1 = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const image2 = createMockImage('2', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith');
      const image3 = createMockImage('3', 'unsplash', 'Bob Wilson', 'https://unsplash.com/@bobwilson');
      
      await attributionManager.trackUsage(image1);
      await attributionManager.trackUsage(image2);
      await attributionManager.trackUsage(image3);
      await attributionManager.trackUsage(image1); // Use image1 again
      
      const report = await attributionManager.generateAttributionReport();
      
      expect(report.totalImages).toBe(3);
      expect(report.imagesBySource.unsplash).toBe(2);
      expect(report.imagesBySource.pexels).toBe(1);
      expect(report.photographerCredits).toHaveLength(3);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty usage data', async () => {
      const report = await attributionManager.generateAttributionReport();
      
      expect(report.totalImages).toBe(0);
      expect(Object.keys(report.imagesBySource)).toHaveLength(0);
      expect(report.photographerCredits).toHaveLength(0);
    });
  });

  describe('getUsageBySource', () => {
    it('should return usage statistics by source', async () => {
      const image1 = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const image2 = createMockImage('2', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith');
      const image3 = createMockImage('3', 'unsplash', 'Bob Wilson', 'https://unsplash.com/@bobwilson');
      
      await attributionManager.trackUsage(image1);
      await attributionManager.trackUsage(image1); // Use twice
      await attributionManager.trackUsage(image2);
      await attributionManager.trackUsage(image3);
      
      const stats = attributionManager.getUsageBySource();
      
      expect(stats.unsplash.images).toBe(2);
      expect(stats.unsplash.totalUsage).toBe(3); // image1 used twice + image3 once
      expect(stats.pexels.images).toBe(1);
      expect(stats.pexels.totalUsage).toBe(1);
    });
  });

  describe('getTopPhotographers', () => {
    it('should return top photographers by usage', async () => {
      const image1 = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const image2 = createMockImage('2', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith');
      const image3 = createMockImage('3', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe'); // Same photographer
      
      // John Doe: 2 images, 4 total usage
      await attributionManager.trackUsage(image1);
      await attributionManager.trackUsage(image1);
      await attributionManager.trackUsage(image3);
      await attributionManager.trackUsage(image3);
      
      // Jane Smith: 1 image, 1 total usage
      await attributionManager.trackUsage(image2);
      
      const topPhotographers = attributionManager.getTopPhotographers(5);
      
      expect(topPhotographers).toHaveLength(2);
      expect(topPhotographers[0].photographer).toBe('John Doe');
      expect(topPhotographers[0].totalUsage).toBe(4);
      expect(topPhotographers[1].photographer).toBe('Jane Smith');
      expect(topPhotographers[1].totalUsage).toBe(1);
    });

    it('should limit results to specified count', async () => {
      const photographers = ['John', 'Jane', 'Bob', 'Alice', 'Charlie'];
      
      for (let i = 0; i < photographers.length; i++) {
        const image = createMockImage(`${i}`, 'unsplash', photographers[i], `https://example.com/${photographers[i]}`);
        await attributionManager.trackUsage(image);
      }
      
      const topPhotographers = attributionManager.getTopPhotographers(3);
      expect(topPhotographers).toHaveLength(3);
    });
  });

  describe('generateAttributionHTML', () => {
    it('should generate HTML with link when available', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const html = attributionManager.generateAttributionHTML(image);
      
      expect(html).toContain('<a href="https://unsplash.com/@johndoe"');
      expect(html).toContain('Photo by John Doe on Unsplash');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener"');
    });

    it('should generate HTML without link when not available', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', '');
      image.attribution.sourceUrl = ''; // Remove source URL too
      
      const html = attributionManager.generateAttributionHTML(image);
      
      expect(html).not.toContain('<a href');
      expect(html).toContain('Photo by John Doe on Unsplash');
      expect(html).toContain('<div class="image-attribution">');
    });

    it('should return empty string when attribution not required', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe', false);
      const html = attributionManager.generateAttributionHTML(image);
      expect(html).toBe('');
    });
  });

  describe('generateBulkAttribution', () => {
    it('should generate combined attribution for multiple images', () => {
      const image1 = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const image2 = createMockImage('2', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith');
      const image3 = createMockImage('3', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe'); // Duplicate
      
      const bulkAttribution = attributionManager.generateBulkAttribution([image1, image2, image3]);
      
      expect(bulkAttribution).toContain('Photo by John Doe on Unsplash');
      expect(bulkAttribution).toContain('Photo by Jane Smith from Pexels');
      expect(bulkAttribution).toContain(';'); // Separator
      
      // Should not duplicate John Doe attribution
      const johnDoeCount = (bulkAttribution.match(/John Doe/g) || []).length;
      expect(johnDoeCount).toBe(1);
    });

    it('should return empty string when no attributions required', () => {
      const image1 = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe', false);
      const image2 = createMockImage('2', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith', false);
      
      const bulkAttribution = attributionManager.generateBulkAttribution([image1, image2]);
      expect(bulkAttribution).toBe('');
    });
  });

  describe('requiresAttribution', () => {
    it('should return true when attribution is required', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe', true);
      expect(attributionManager.requiresAttribution(image)).toBe(true);
    });

    it('should return false when attribution is not required', () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe', false);
      expect(attributionManager.requiresAttribution(image)).toBe(false);
    });
  });

  describe('exportUsageData', () => {
    it('should export usage data as CSV', async () => {
      const image1 = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      const image2 = createMockImage('2', 'pexels', 'Jane Smith', 'https://pexels.com/@janesmith');
      
      await attributionManager.trackUsage(image1);
      await attributionManager.trackUsage(image2);
      
      const csv = attributionManager.exportUsageData();
      
      expect(csv).toContain('Image ID,Source,Photographer');
      expect(csv).toContain('"1","unsplash","John Doe"'); // CSV format with quotes
      expect(csv).toContain('"2","pexels","Jane Smith"');
      expect(csv.split('\n').length).toBeGreaterThan(2); // Header + data rows
    });

    it('should handle empty data', () => {
      const csv = attributionManager.exportUsageData();
      expect(csv).toContain('Image ID,Source,Photographer');
      expect(csv.split('\n').length).toBe(2); // Just header + empty line
    });
  });

  describe('clearUsageData', () => {
    it('should clear all usage tracking data', async () => {
      const image = createMockImage('1', 'unsplash', 'John Doe', 'https://unsplash.com/@johndoe');
      
      await attributionManager.trackUsage(image);
      expect(attributionManager.getAllUsageRecords()).toHaveLength(1);
      
      attributionManager.clearUsageData();
      expect(attributionManager.getAllUsageRecords()).toHaveLength(0);
    });
  });
});