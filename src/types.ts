/**
 * Type definitions for When to Wash
 */

export interface HourlyPrice {
  hour: number; // 0-23
  price: number; // Price in EUR/MWh or similar unit
  timestamp: Date;
}

export interface PriceBlock {
  startHour: number;
  endHour: number;
  averagePrice: number;
  duration: number; // hours
}

export type PriceStatus = 'cheap' | 'normal' | 'expensive';

export interface DayPrices {
  date: Date;
  hourlyPrices: HourlyPrice[];
  averagePrice: number;
  currentStatus: PriceStatus;
  /** Single cheapest hour of the day (0-23) */
  cheapestHour: number;
  /** All blocks of consecutive cheap hours, sorted cheapest first */
  cheapBlocks: PriceBlock[];
  bestBlock: PriceBlock | null;
  secondBestBlock: PriceBlock | null;
}
