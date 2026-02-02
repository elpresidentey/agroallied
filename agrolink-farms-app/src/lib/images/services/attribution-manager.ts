/**
 * AttributionManager - Handles photographer credits and compliance
 * Manages attribution storage, formatting, and usage tracking for API compliance
 */

import { AttributionManager as IAttributionManager, ImageResult, AttributionReport } from '../types';

interface UsageRecord {
  imageId: string;
  source: string;
  photographer: string;
  photographerUrl: string;
  usageCount: number;
  firstUsed: Date;
  lastUsed: Date;
}

export class AttributionManager implements IAttributionManager {
  private usageTracker: Map<string, UsageRecord> = new Map();

  formatAttribution(image: ImageResult): string {
    const { attribution } = image;
    
    if (!attribution.required) {
      return '';
    }

    // Format based on source
    switch (image.source) {
      case 'unsplash':
        return `Photo by ${attribution.photographer} on Unsplash`;
      
      case 'pexels':
        return `Photo by ${attribution.photographer} from Pexels`;
      
      default:
        return `Photo by ${attribution.photographer}`;
    }
  }

  getAttributionLink(image: ImageResult): string {
    const { attribution } = image;
    
    if (!attribution.required) {
      return '';
    }

    // Return photographer URL if available, otherwise source URL
    return attribution.photographerUrl || attribution.sourceUrl || '';
  }

  async trackUsage(image: ImageResult): Promise<void> {
    const key = `${image.source}-${image.id}`;
    const existing = this.usageTracker.get(key);
    const now = new Date();

    if (existing) {
      // Update existing record
      existing.usageCount++;
      existing.lastUsed = now;
    } else {
      // Create new record
      const record: UsageRecord = {
        imageId: image.id,
        source: image.source,
        photographer: image.attribution.photographer,
        photographerUrl: image.attribution.photographerUrl,
        usageCount: 1,
        firstUsed: now,
        lastUsed: now
      };
      this.usageTracker.set(key, record);
    }
  }

  async generateAttributionReport(): Promise<AttributionReport> {
    const records = Array.from(this.usageTracker.values());
    const totalImages = records.length;
    
    // Group by source
    const imagesBySource: Record<string, number> = {};
    for (const record of records) {
      imagesBySource[record.source] = (imagesBySource[record.source] || 0) + 1;
    }

    // Group by photographer
    const photographerCredits = records.map(record => ({
      photographer: record.photographer,
      imageCount: record.usageCount,
      source: record.source
    }));

    return {
      totalImages,
      totalUsage: records.reduce((sum, record) => sum + record.usageCount, 0),
      missingAttributions: 0, // TODO: Implement missing attribution detection
      imagesBySource,
      photographerCredits,
      generatedAt: new Date()
    };
  }

  /**
   * Get usage statistics for a specific image
   */
  getImageUsage(imageId: string, source: string): UsageRecord | null {
    const key = `${source}-${imageId}`;
    return this.usageTracker.get(key) || null;
  }

  /**
   * Get all usage records
   */
  getAllUsageRecords(): UsageRecord[] {
    return Array.from(this.usageTracker.values());
  }

  /**
   * Clear usage tracking data
   */
  clearUsageData(): void {
    this.usageTracker.clear();
  }

  /**
   * Get usage statistics by source
   */
  getUsageBySource(): Record<string, { images: number; totalUsage: number }> {
    const stats: Record<string, { images: number; totalUsage: number }> = {};
    
    for (const record of this.usageTracker.values()) {
      if (!stats[record.source]) {
        stats[record.source] = { images: 0, totalUsage: 0 };
      }
      stats[record.source].images++;
      stats[record.source].totalUsage += record.usageCount;
    }
    
    return stats;
  }

  /**
   * Get top photographers by usage
   */
  getTopPhotographers(limit: number = 10): Array<{ photographer: string; imageCount: number; totalUsage: number }> {
    const photographerStats: Record<string, { imageCount: number; totalUsage: number }> = {};
    
    for (const record of this.usageTracker.values()) {
      if (!photographerStats[record.photographer]) {
        photographerStats[record.photographer] = { imageCount: 0, totalUsage: 0 };
      }
      photographerStats[record.photographer].imageCount++;
      photographerStats[record.photographer].totalUsage += record.usageCount;
    }
    
    return Object.entries(photographerStats)
      .map(([photographer, stats]) => ({
        photographer,
        imageCount: stats.imageCount,
        totalUsage: stats.totalUsage
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, limit);
  }

  /**
   * Generate HTML attribution block for display
   */
  generateAttributionHTML(image: ImageResult): string {
    const attribution = this.formatAttribution(image);
    const link = this.getAttributionLink(image);
    
    if (!attribution) {
      return '';
    }
    
    if (link) {
      return `<div class="image-attribution"><a href="${link}" target="_blank" rel="noopener">${attribution}</a></div>`;
    }
    
    return `<div class="image-attribution">${attribution}</div>`;
  }

  /**
   * Generate attribution text for multiple images
   */
  generateBulkAttribution(images: ImageResult[]): string {
    const attributions = new Set<string>();
    
    for (const image of images) {
      const attribution = this.formatAttribution(image);
      if (attribution) {
        attributions.add(attribution);
      }
    }
    
    if (attributions.size === 0) {
      return '';
    }
    
    return Array.from(attributions).join('; ');
  }

  /**
   * Check if image requires attribution
   */
  requiresAttribution(image: ImageResult): boolean {
    return image.attribution.required;
  }

  /**
   * Export usage data for compliance reporting
   */
  exportUsageData(): string {
    const records = this.getAllUsageRecords();
    const csvHeader = 'Image ID,Source,Photographer,Photographer URL,Usage Count,First Used,Last Used\n';
    
    const csvRows = records.map(record => 
      `"${record.imageId}","${record.source}","${record.photographer}","${record.photographerUrl}",${record.usageCount},"${record.firstUsed.toISOString()}","${record.lastUsed.toISOString()}"`
    ).join('\n');
    
    return csvHeader + csvRows;
  }
}