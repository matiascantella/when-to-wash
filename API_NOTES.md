# API Integration Notes

## Primary API: Elering (Estonia) ✅

**Recommended - No authentication required!**

- **URL**: `https://dashboard.elering.ee/api/nps/price?start=YYYY-MM-DDTHH:mm:ssZ&end=YYYY-MM-DDTHH:mm:ssZ`
- **Coverage**: EE (Estonia), LV (Latvia), LT (Lithuania), FI (Finland)
- **Format**: JSON
- **Auth**: None required
- **Docs**: https://dashboard.elering.ee/assets/api-doc.html#/nps-controller/getPriceUsingGET

### Example Request

```bash
curl -X GET "https://dashboard.elering.ee/api/nps/price?start=2024-01-15T00:00:00Z&end=2024-01-15T23:59:59.999Z" \
  -H "accept: */*"
```

### Response Structure

```json
{
  "data": {
    "ee": [
      {
        "timestamp": 1705276800000,
        "price": 80.5
      },
      ...
    ]
  }
}
```

- `timestamp`: Unix timestamp in milliseconds
- `price`: Price in EUR/MWh

## Alternative APIs

### 2. Nord Pool Direct
- **URL**: `https://www.nordpoolgroup.com/api/marketdata/page/10/EUR/DD-MM-YYYY`
- **Coverage**: Nordic/Baltic region (DK1, DK2, EE, LV, LT, FI, etc.)
- **Format**: JSON
- **Note**: Structure may vary, needs testing

### 3. Entsoe Transparency Platform
- **URL**: `https://web-api.tp.entsoe.eu/api`
- **Coverage**: All European countries
- **Format**: XML (requires parsing)
- **Auth**: Requires API token (free registration)
- **Docs**: https://transparency.entsoe.eu/

## Implementation Status

✅ **Elering API integrated** - Primary source for Estonia
- No authentication needed
- Returns hourly prices for the day
- Covers Estonia, Latvia, Lithuania, Finland

## Testing

```bash
cd /Users/nadieestaaca/Desktop/when-to-wash
npm install
npm run dev
```

Open browser console (F12) to see:
- API request URL
- Response structure
- Parsed prices

## References

- [GitHub Discussion on Nord Pool Integration](https://github.com/evcc-io/evcc/discussions/1545)
- [Elering API Documentation](https://dashboard.elering.ee/assets/api-doc.html#/nps-controller/getPriceUsingGET)

