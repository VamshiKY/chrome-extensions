# Stock Price Tracker Chrome Extension

A powerful Chrome extension that allows you to track stock prices from multiple exchanges in real-time. Monitor US stocks (NASDAQ, NYSE) and Indian stocks (NSE, BSE) with automatic currency conversion and intelligent search suggestions.

![Stock Tracker Screenshot](https://via.placeholder.com/640x400?text=Stock+Tracker+Screenshot)

## Features

- **Multi-Exchange Support**: Track stocks from US and Indian markets
- **Real-Time Data**: Fetch stock prices from multiple reliable APIs
- **Smart Search**: Intelligent autosuggest with keyboard navigation
- **Currency Display**: Automatic currency symbol ($ or Rs) based on the exchange
- **Customizable**: Add any stock symbol from supported exchanges
- **Responsive UI**: Clean, modern interface with loading animations
- **Data Caching**: Efficient caching system to minimize API calls
- **Offline Fallback**: Continues to work even when APIs are unavailable

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link will be updated when published)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your browser toolbar

## Usage

### Adding Stocks
1. Click the extension icon in your browser toolbar
2. Type a stock symbol or company name in the search box
3. Select from the suggestions or enter a custom symbol
4. Click "Add" to start tracking the stock

### Supported Stock Formats
- US Stocks: Simple symbol (e.g., `AAPL`, `MSFT`, `GOOGL`)
- Indian NSE Stocks: Symbol with `.NS` suffix (e.g., `RELIANCE.NS`, `TCS.NS`)
- Indian BSE Stocks: Symbol with `.BSE` or `.BO` suffix (e.g., `RELIANCE.BSE`)

### Keyboard Shortcuts
- `↑` / `↓`: Navigate through search suggestions
- `Enter`: Select the highlighted suggestion
- `Esc`: Close the suggestions dropdown

## Configuration

### Options Page
Right-click the extension icon and select "Options" to access:
- Default stocks for new installations
- Update frequency settings
- Display preferences
- Market settings

## Technical Details

### APIs Used
The extension uses multiple stock data APIs with a fallback strategy:

1. **Alpha Vantage API** (Primary)
   - Free tier: 5 requests per minute, 500 requests per day
   - Used for stock prices and symbol validation

2. **Finnhub API** (Secondary)
   - Free tier: 60 requests per minute
   - Used as backup when Alpha Vantage fails

3. **Yahoo Finance** (Tertiary)
   - No API key required
   - Used as a last resort

### API Keys
The extension includes demo API keys with limited usage. For production use, replace them with your own keys:

1. Open `background.js`
2. Find the API key variables:
   ```javascript
   const apiKey = 'XOLA7URKCZHU7C9X'; // Alpha Vantage
   const apiKey = 'cju3it9r01qr958385t0cju3it9r01qr958385tg'; // Finnhub
   ```
3. Replace with your own keys from:
   - [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - [Finnhub](https://finnhub.io/register)

## Project Structure

```
stock-tracker-extension/
├── manifest.json        # Extension configuration
├── popup.html           # Main extension popup UI
├── popup.js             # Popup functionality
├── background.js        # Background service worker
├── autosuggest.js       # Stock search suggestions
├── options.html         # Options page
├── options.js           # Options functionality
├── images/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── api-keys.md          # API key documentation
└── README.md            # This file
```

## Development

### Prerequisites
- Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript
- API keys for stock data services (for production use)

### Local Development
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Building for Production
1. Replace demo API keys with your own
2. Zip the entire folder
3. Submit to the Chrome Web Store

## Limitations

- Free API tiers have rate limits (see API Keys section)
- Some stock symbols may not be available in the free API tiers
- CORS proxy may occasionally experience downtime

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Stock data provided by Alpha Vantage, Finnhub, and Yahoo Finance
- CORS proxy service by corsproxy.io
- Icon design by [Your Name]

## Support

For issues, feature requests, or questions, please [open an issue](https://github.com/yourusername/stock-tracker-extension/issues) on the GitHub repository.