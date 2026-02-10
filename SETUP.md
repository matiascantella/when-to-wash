# Setup Instructions

## Install Dependencies

```bash
cd /Users/nadieestaaca/Desktop/when-to-wash
npm install
```

## Run Development Server

```bash
npm run dev
```

## Test API Integration

The app will automatically try to fetch real prices from:
- `https://api.spot-hinta.fi/JustNow?area=EE` (current price)
- `https://api.spot-hinta.fi/Hourly24?area=EE&date=YYYY-MM-DD` (24h prices)

If the API fails, it will fallback to mock data and show a warning.

## Check Browser Console

Open browser DevTools (F12) and check the Console tab to see:
- API response structure
- Any parsing errors
- Which API endpoint worked

## Adjust Parser

Based on the actual API response structure you see in the console, adjust the `parseSpotHintaResponse` function in `src/utils/api.ts`.
