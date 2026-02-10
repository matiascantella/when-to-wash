/**
 * API utilities for fetching electricity prices
 * For Estonia, we use Elering API (no token required)
 * Documentation: https://dashboard.elering.ee/assets/api-doc.html#/nps-controller/getPriceUsingGET
 * 
 * Also supports:
 * - Nord Pool direct API
 * - Entsoe Transparency Platform (requires token)
 */

import { HourlyPrice } from '../types';

const ELERING_API_BASE = 'https://dashboard.elering.ee/api/nps/price';

/**
 * Fetch hourly electricity prices for Estonia
 * Uses Entsoe Transparency Platform API
 * 
 * @param date - Date to fetch prices for
 * @returns Array of hourly prices
 */
/**
 * Fetch hourly electricity prices for Estonia using Elering API
 * No authentication required!
 * 
 * @param date - Date to fetch prices for
 * @returns Array of hourly prices
 */
/** Get "today" in browser local time. */
function getTodayLocal(now: Date = new Date()): { year: number; month: number; day: number } {
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate()
  };
}

export async function fetchEstoniaPrices(date: Date = new Date()): Promise<HourlyPrice[]> {
  // Use local calendar day: 00:00 -> 23:59:59.999
  const local = getTodayLocal(date);
  const year = local.year;
  const month = local.month;
  const day = local.day;

  const startUTC = new Date(year, month, day, 0, 0, 0, 0);
  const endUTC = new Date(year, month, day, 23, 59, 59, 999);
  const startStr = startUTC.toISOString().replace(/\.000Z$/, 'Z');
  const endStr = endUTC.toISOString().replace(/\.(\d{3})Z$/, '.$1Z');
  
  try {
    const url = `${ELERING_API_BASE}?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`;
    console.log('Fetching from Elering API:', url);
    
    let response: Response;
    let data: any;

    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    // Try proxy first (browser CORS usually blocks direct), then direct
    for (const proxyUrl of proxies) {
      try {
        response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const text = await response.text();
          const parsed = JSON.parse(text);
          if (parsed?.data?.ee?.length) {
            data = parsed;
            break;
          }
        }
      } catch (_) {
        continue;
      }
    }

    if (!data?.data?.ee?.length) {
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) data = await response.json();
      } catch (_) {}
    }

    if (!data?.data?.ee?.length) {
      throw new Error('Unable to fetch from Elering API (CORS/network issue)');
    }
    
    console.log('Elering API response:', data);
    
    const prices = parseEleringResponse(data, date, local);
    if (prices.length > 0) {
      return prices;
    }
    
    throw new Error('No prices found in Elering response');
    
  } catch (error) {
    console.error('Error fetching from Elering API:', error);
    throw error;
  }
}

/**
 * Parse Elering API response
 * API docs: https://dashboard.elering.ee/assets/api-doc.html#/nps-controller/getPriceUsingGET
 * 
 * Response structure:
 * {
 *   "data": {
 *     "ee": [
 *       {
 *         "timestamp": 1631491200000,  // Unix timestamp in milliseconds
 *         "price": 80.5                 // Price in EUR/MWh
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
function parseEleringResponse(
  data: any,
  _date: Date,
  todayLocal: { year: number; month: number; day: number }
): HourlyPrice[] {
  const prices: HourlyPrice[] = [];
  
  const estoniaData = data?.data?.ee;
  if (!estoniaData || !Array.isArray(estoniaData)) {
    console.warn('Unexpected Elering API response structure:', data);
    return [];
  }

  // CSV/API can return unix seconds or milliseconds.
  const toMs = (t: number) => (t >= 1e8 && t <= 1e11 ? t * 1000 : t);
  
  const byHour: Record<number, number[]> = {};
  estoniaData.forEach((item: any) => {
    if (item.timestamp == null || item.price === undefined) return;
    const ms = toMs(Number(item.timestamp));
    const d = new Date(ms);
    // Keep only points that belong to today's local date.
    if (
      d.getFullYear() !== todayLocal.year ||
      d.getMonth() !== todayLocal.month ||
      d.getDate() !== todayLocal.day
    ) return;
    const hourLocal = d.getHours();
    if (!byHour[hourLocal]) byHour[hourLocal] = [];
    byHour[hourLocal].push(Number(item.price));
  });

  // One bar per hour: average price for that hour
  for (let hour = 0; hour < 24; hour++) {
    const values = byHour[hour];
    if (values?.length) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      prices.push({
        hour,
        price: avg,
        timestamp: new Date()
      });
    }
  }

  prices.sort((a, b) => a.hour - b.hour);

  if (prices.length < 24) {
    console.warn(`Only received ${prices.length} hours, expected 24`);
  }

  return prices;
}

/**
 * Alternative: Fetch from Nord Pool direct API
 * Format: https://www.nordpoolgroup.com/api/marketdata/page/10/EUR/DD-MM-YYYY
 * 
 * Note: This is a fallback option. Elering is preferred for Estonia.
 */
export async function fetchNordPoolPrices(date: Date = new Date()): Promise<HourlyPrice[]> {
  try {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    
    const url = `https://www.nordpoolgroup.com/api/marketdata/page/10/EUR/${dateStr}`;
    console.log('Fetching from Nord Pool API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nord Pool API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Nord Pool Response:', data);
    
    return parseNordPoolResponse(data, date);
    
  } catch (error) {
    console.error('Error fetching Nord Pool prices:', error);
    throw error;
  }
}

function parseNordPoolResponse(_data: any, _date: Date): HourlyPrice[] {
  // Nord Pool API structure varies - this is a placeholder
  const prices: HourlyPrice[] = [];
  return prices;
}

