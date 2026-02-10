/**
 * Price calculation utilities
 */

import { HourlyPrice, PriceBlock, PriceStatus, DayPrices } from '../types';

/**
 * Calculate average price from hourly prices
 */
export function calculateAveragePrice(prices: HourlyPrice[]): number {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((acc, p) => acc + p.price, 0);
  return sum / prices.length;
}

/**
 * Determine price status based on current price vs average
 */
export function getPriceStatus(currentPrice: number, averagePrice: number): PriceStatus {
  const ratio = currentPrice / averagePrice;
  
  if (ratio < 0.9) return 'cheap';
  if (ratio > 1.1) return 'expensive';
  return 'normal';
}

/**
 * Find consecutive blocks of hours with similar prices
 * Returns blocks sorted by average price (cheapest first)
 * 
 * Strategy: Find blocks where prices are below the daily average
 * and group consecutive hours with similar prices
 */
export function findPriceBlocks(prices: HourlyPrice[]): PriceBlock[] {
  if (prices.length === 0) return [];

  const averagePrice = calculateAveragePrice(prices);
  
  // First, identify "cheap" hours (below average)
  // Use a more flexible threshold: anything below average is considered cheap
  const cheapHours = prices
    .map((p, index) => ({ ...p, index }))
    .filter(p => p.price < averagePrice); // Below average = cheap

  if (cheapHours.length === 0) {
    // If no cheap hours, return the single cheapest hour
    const cheapest = prices.reduce((min, p) => p.price < min.price ? p : min);
    return [{
      startHour: cheapest.hour,
      endHour: cheapest.hour,
      averagePrice: cheapest.price,
      duration: 1
    }];
  }

  // Group consecutive cheap hours into blocks
  const blocks: PriceBlock[] = [];
  let currentBlockStart = cheapHours[0].index;
  let currentBlockSum = cheapHours[0].price;
  let currentBlockCount = 1;

  for (let i = 1; i < cheapHours.length; i++) {
    const prevIndex = cheapHours[i - 1].index;
    const currIndex = cheapHours[i].index;
    
    // Check if hours are consecutive (within 2 hours to allow for gaps)
    if (currIndex - prevIndex <= 2) {
      currentBlockSum += cheapHours[i].price;
      currentBlockCount++;
    } else {
      // Save current block
      const startHour = prices[currentBlockStart].hour;
      const endHour = prices[cheapHours[i - 1].index].hour;
      blocks.push({
        startHour,
        endHour,
        averagePrice: currentBlockSum / currentBlockCount,
        duration: currentBlockCount
      });

      // Start new block
      currentBlockStart = currIndex;
      currentBlockSum = cheapHours[i].price;
      currentBlockCount = 1;
    }
  }

  // Save last block
  const startHour = prices[currentBlockStart].hour;
  const endHour = prices[cheapHours[cheapHours.length - 1].index].hour;
  blocks.push({
    startHour,
    endHour,
    averagePrice: currentBlockSum / currentBlockCount,
    duration: currentBlockCount
  });

  // Sort by average price (cheapest first), then by duration (longer first if same price)
  return blocks.sort((a, b) => {
    if (Math.abs(a.averagePrice - b.averagePrice) < 0.01) {
      return b.duration - a.duration; // Longer blocks first if same price
    }
    return a.averagePrice - b.averagePrice;
  });
}

/** Current hour in browser local time. */
export function getHourEET(date: Date = new Date()): number {
  return date.getHours();
}

/**
 * Process daily prices and find best blocks
 */
export function processDayPrices(hourlyPrices: HourlyPrice[]): DayPrices {
  const averagePrice = calculateAveragePrice(hourlyPrices);
  const currentHour = getHourEET();
  const currentPrice = hourlyPrices.find(p => p.hour === currentHour)?.price || averagePrice;
  const currentStatus = getPriceStatus(currentPrice, averagePrice);

  const blocks = findPriceBlocks(hourlyPrices);
  const bestBlock = blocks.length > 0 ? blocks[0] : null;
  const secondBestBlock = blocks.length > 1 ? blocks[1] : null;

  const cheapest = hourlyPrices.reduce((min, p) => p.price < min.price ? p : min);
  const cheapestHour = cheapest.hour;

  return {
    date: new Date(),
    hourlyPrices,
    averagePrice,
    currentStatus,
    cheapestHour,
    cheapBlocks: blocks,
    bestBlock,
    secondBestBlock
  };
}

/**
 * Format hour for display (e.g., "14:00")
 */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Format duration for display (e.g., "~2h")
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `~${minutes}m`;
  }
  if (hours === 1) return '~1h';
  return `~${Math.round(hours)}h`;
}

