/**
 * Mock data for development
 * In production, this will fetch from Nord Pool API or similar
 */

import { HourlyPrice } from '../types';

/**
 * Generate mock hourly prices for a day
 * Simulates realistic price variations (cheaper at night, expensive during peak)
 */
export function generateMockPrices(date: Date = new Date()): HourlyPrice[] {
  const prices: HourlyPrice[] = [];
  const basePrice = 80; // Base price in EUR/MWh
  
  for (let hour = 0; hour < 24; hour++) {
    let price = basePrice;
    
    // Night hours (0-6): cheaper
    if (hour >= 0 && hour < 6) {
      price = basePrice * (0.6 + Math.random() * 0.2);
    }
    // Morning (6-9): rising
    else if (hour >= 6 && hour < 9) {
      price = basePrice * (0.8 + Math.random() * 0.3);
    }
    // Day (9-17): normal to expensive
    else if (hour >= 9 && hour < 17) {
      price = basePrice * (1.0 + Math.random() * 0.4);
    }
    // Evening peak (17-20): most expensive
    else if (hour >= 17 && hour < 20) {
      price = basePrice * (1.3 + Math.random() * 0.3);
    }
    // Night (20-24): getting cheaper
    else {
      price = basePrice * (0.7 + Math.random() * 0.3);
    }
    
    prices.push({
      hour,
      price: Math.round(price * 100) / 100,
      timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour)
    });
  }
  
  return prices;
}
