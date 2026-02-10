import { useState, useEffect } from 'react';
import { DayPrices } from './types';
import { generateMockPrices } from './utils/mockData';
import { fetchEstoniaPrices } from './utils/api';
import { processDayPrices } from './utils/prices';
import { formatHour, formatDuration, getHourEET } from './utils/prices';

const COLORS = {
  CHEAP: '#00B67A',
  NORMAL: '#666666',
  EXPENSIVE: '#FF6B6B',
  BACKGROUND: '#FAFAFA',
  BG_SECONDARY: '#F0F0F0',
  TEXT: '#000000',
  TEXT_SECONDARY: '#666666',
  BORDER: '#E5E5E5',
} as const;

function App() {
  const [dayData, setDayData] = useState<DayPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  useEffect(() => {
    const loadPrices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch real prices from API
        const prices = await fetchEstoniaPrices();
        if (prices.length > 0) {
          const processed = processDayPrices(prices);
          setDayData(processed);
        } else {
          throw new Error('No prices returned from API');
        }
      } catch (err) {
        console.warn('API fetch failed, using mock data:', err);
        // Fallback to mock data if API fails
        const mockPrices = generateMockPrices();
        const processed = processDayPrices(mockPrices);
        setDayData(processed);
        setError('Using demo data - API unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrices();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: COLORS.BACKGROUND,
        color: COLORS.TEXT,
        fontSize: '18px'
      }}>
        Loading prices...
      </div>
    );
  }

  if (!dayData) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: COLORS.BACKGROUND,
        color: COLORS.TEXT
      }}>
        No data available
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cheap': return COLORS.CHEAP;
      case 'expensive': return COLORS.EXPENSIVE;
      default: return COLORS.NORMAL;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'cheap': return 'Cheap';
      case 'expensive': return 'Expensive';
      default: return 'Normal';
    }
  };

  const getAverageText = (average: number, prices: typeof dayData.hourlyPrices) => {
    const min = Math.min(...prices.map(p => p.price));
    const max = Math.max(...prices.map(p => p.price));
    const range = max - min;
    const position = (average - min) / range;
    
    if (position < 0.33) return 'Low';
    if (position < 0.67) return 'Medium';
    return 'High';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.BACKGROUND,
      padding: '32px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Current Status */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{
          fontSize: '64px',
          fontWeight: 'bold',
          color: getStatusColor(dayData.currentStatus),
          marginBottom: '8px',
          lineHeight: 1
        }}>
          {getStatusText(dayData.currentStatus)}
        </div>
        <div style={{
          fontSize: '18px',
          color: COLORS.TEXT_SECONDARY,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Now
        </div>
        <div style={{
          fontSize: '26px',
          lineHeight: 1,
          marginTop: '4px'
        }}>
          🧺
        </div>
      </div>

      {/* Best hour of the day: single cheapest hour */}
      {(() => {
        const cheapestPrice = dayData.hourlyPrices.find(p => p.hour === dayData.cheapestHour)?.price;
        const bestHourStr = formatHour(dayData.cheapestHour);
        return (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '40px',
              fontWeight: 'bold',
              color: COLORS.TEXT,
              marginBottom: '12px',
              lineHeight: 1.1
            }}>
              Best hour of the day: {bestHourStr}
            </div>
            <div style={{
              fontSize: '12px',
              color: COLORS.TEXT_SECONDARY,
              opacity: 0.7,
              marginBottom: '8px'
            }}>
              from {cheapestPrice?.toFixed(2) ?? '—'} €/MWh · Eesti time
            </div>
            {/* Best time: un solo intervalo (más barato en promedio y más largo) */}
            {dayData.bestBlock && (
              <div style={{
                fontSize: '16px',
                color: COLORS.TEXT_SECONDARY,
                lineHeight: 1.4
              }}>
                <strong style={{ color: COLORS.TEXT }}>Best time:</strong>{' '}
                {dayData.bestBlock.startHour === dayData.bestBlock.endHour
                  ? formatHour(dayData.bestBlock.startHour)
                  : `${formatHour(dayData.bestBlock.startHour)} – ${formatHour(dayData.bestBlock.endHour)}`}
                {' '}
                <span style={{ opacity: 0.85 }}>
                  (avg {dayData.bestBlock.averagePrice.toFixed(2)} €/MWh)
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Timeline */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '18px',
            color: COLORS.TEXT,
            fontWeight: 500
          }}>
            Today
          </div>
          <div style={{
            fontSize: '12px',
            color: COLORS.TEXT_SECONDARY,
            opacity: 0.7
          }}>
            All times Eesti time
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: COLORS.TEXT_SECONDARY,
          opacity: 0.6,
          marginBottom: '8px'
        }}>
          Data is shown in Eesti time.
        </div>
        <div style={{
          display: 'flex',
          gap: '2px',
          height: '60px',
          marginBottom: '8px'
        }}>
          {dayData.hourlyPrices.map((price) => {
            const ratio = price.price / dayData.averagePrice;
            let color: string = COLORS.NORMAL;
            if (ratio < 0.9) color = COLORS.CHEAP;
            else if (ratio > 1.1) color = COLORS.EXPENSIVE;

            const isCurrentHour = price.hour === getHourEET();
            const isSelected = hoveredHour === price.hour;
            
            return (
              <div
                key={price.hour}
                role="button"
                tabIndex={0}
                style={{
                  flex: 1,
                  backgroundColor: color,
                  opacity: isCurrentHour || isSelected ? 1 : 0.7,
                  border: isCurrentHour ? `2px solid ${COLORS.TEXT}` : isSelected ? `2px solid ${COLORS.TEXT_SECONDARY}` : 'none',
                  transition: 'opacity 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => setHoveredHour(price.hour)}
                onTouchEnd={() => setTimeout(() => setHoveredHour(null), 2500)}
              />
            );
          })}
        </div>
        {/* Tooltip: show under bars when a bar is clicked or touched */}
        {hoveredHour !== null && (() => {
          const p = dayData.hourlyPrices.find(x => x.hour === hoveredHour);
          if (!p) return null;
          return (
            <div style={{
              marginBottom: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.TEXT,
              backgroundColor: COLORS.BG_SECONDARY,
              borderRadius: '4px'
            }}>
              {formatHour(hoveredHour)} — {p.price.toFixed(2)} €/MWh
            </div>
          );
        })()}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: COLORS.TEXT_SECONDARY
        }}>
          <span>00</span>
          <span>12</span>
          <span>24</span>
        </div>
      </div>

      {/* Average Price */}
      <div style={{
        paddingTop: '24px',
        borderTop: `1px solid ${COLORS.BORDER}`
      }}>
        <div style={{
          fontSize: '18px',
          color: COLORS.TEXT,
          marginBottom: '8px',
          fontWeight: 500
        }}>
          Today's average price
        </div>
        <div style={{
          fontSize: '24px',
          color: COLORS.TEXT,
          marginBottom: '4px'
        }}>
          {dayData.averagePrice.toFixed(2)} €/MWh
        </div>
        <div style={{
          fontSize: '14px',
          color: COLORS.TEXT_SECONDARY
        }}>
          {getAverageText(dayData.averagePrice, dayData.hourlyPrices)} compared to recent days
        </div>
      </div>

      {/* Error message if using mock data */}
      {error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#FFF3CD',
          border: `1px solid #FFC107`,
          fontSize: '14px',
          color: '#856404'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default App;

