# API Keys for Stock Tracker Extension

This extension uses several free public APIs to fetch stock data. The current implementation includes demo/free API keys with limited usage. For production use, you should replace these with your own API keys.

## Alpha Vantage

- Current key: `XOLA7URKCZHU7C9X` (demo key with limited usage)
- Get your own key: [Alpha Vantage API](https://www.alphavantage.co/support/#api-key)
- Free tier: 5 API requests per minute, 500 requests per day
- Used for: Stock price data and symbol validation

## Finnhub

- Current key: `cju3it9r01qr958385t0cju3it9r01qr958385tg` (demo key with limited usage)
- Get your own key: [Finnhub API](https://finnhub.io/register)
- Free tier: 60 API calls per minute
- Used for: Backup stock price data

## Yahoo Finance

- No API key required
- Used through a CORS proxy
- Used as a last resort when other APIs fail

## How to Replace API Keys

1. Open `background.js`
2. Find the API key variables:
   - For Alpha Vantage: `const apiKey = 'XOLA7URKCZHU7C9X';`
   - For Finnhub: `const apiKey = 'cju3it9r01qr958385t0cju3it9r01qr958385tg';`
3. Replace these values with your own API keys

## API Rate Limits

Be aware of the rate limits for each API:

- Alpha Vantage: 5 requests/minute (free tier)
- Finnhub: 60 requests/minute (free tier)
- Yahoo Finance: No official limit, but may be blocked if overused

The extension implements caching to minimize API calls. Stock data is cached based on the update frequency setting (default: 5 minutes).