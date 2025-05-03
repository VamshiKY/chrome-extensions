// Set up alarm for periodic updates
chrome.runtime.onInstalled.addListener(() => {
  // Set default options if not already set
  chrome.storage.sync.get({
    defaultStocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NATCOPHARM.NS', 'KITEX.NS', 'KOTAKBANK.NS'],
    updateFrequency: 5,
    showBadge: true,
    showChangeAmount: true,
    defaultMarket: 'NASDAQ'
  }, function(items) {
    chrome.storage.sync.set(items);
    
    // Update stock prices every X minutes (from options)
    chrome.alarms.create('updateStocks', { periodInMinutes: items.updateFrequency });
  });
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateStocks') {
    updateStockPrices();
  }
});

// Function to update stock prices
function updateStockPrices() {
  chrome.storage.sync.get('stocks', function(data) {
    const stocks = data.stocks || [];
    
    if (stocks.length === 0) return;
    
    console.log('Updating stock prices for:', stocks);
    
    // Update badge with number of stocks being tracked
    chrome.action.setBadgeText({ text: stocks.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
    
    // Store the last updated time
    chrome.storage.local.set({ 'lastUpdated': new Date().toISOString() });
    
    // Fetch fresh data for all stocks
    stocks.forEach(symbol => {
      fetchStockPrice(symbol).then(data => {
        console.log(`Updated ${symbol}:`, data);
      }).catch(error => {
        console.error(`Error updating ${symbol}:`, error);
      });
    });
  });
}

// Function to fetch stock price from public APIs
async function fetchStockPrice(symbol) {
  try {
    // Get default market from options
    const options = await chrome.storage.sync.get(['defaultMarket', 'showChangeAmount']);
    const showChangeAmount = options.showChangeAmount !== undefined ? options.showChangeAmount : true;
    
    // Handle symbols with market suffix (like NATCOPHARM.NS)
    let market = options.defaultMarket || 'NASDAQ';
    let stockSymbol = symbol;
    let currency = 'USD'; // Default currency for US markets
    
    // If the symbol contains a dot, it might have a market suffix
    if (symbol.includes('.')) {
      const parts = symbol.split('.');
      stockSymbol = parts[0];
      // Common suffixes: .NS (NSE), .BO (BSE), etc.
      if (parts[1] === 'NS') {
        market = 'NSE';
        currency = 'INR'; // Indian Rupee for NSE
      } else if (parts[1] === 'BO' || parts[1] === 'BSE') {
        market = 'BSE';
        currency = 'INR'; // Indian Rupee for BSE
      }
    }
    
    // Try multiple APIs in sequence until one works
    
    // 1. Try Alpha Vantage API first (free tier, limited to 5 requests per minute)
    try {
      const apiKey = 'XOLA7URKCZHU7C9X'; // This is a demo key, get your own from alphavantage.co
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if we got valid data
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
          const quote = data['Global Quote'];
          const price = parseFloat(quote['05. price']).toFixed(2);
          const changeAmount = parseFloat(quote['09. change']).toFixed(2);
          const changePercent = parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2);
          
          // Store the data in local storage for caching
          const stockData = { 
            price, 
            changePercent, 
            changeAmount,
            lastUpdated: new Date().toISOString(),
            market,
            currency
          };
          
          chrome.storage.local.get('stockData', (data) => {
            const allStockData = data.stockData || {};
            allStockData[symbol] = stockData;
            chrome.storage.local.set({ 'stockData': allStockData });
          });
          
          return { 
            success: true, 
            price, 
            changePercent,
            changeAmount: showChangeAmount ? changeAmount : null,
            currency,
            source: 'Alpha Vantage'
          };
        }
      }
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      // Continue to next API
    }
    
    // 2. Try Finnhub API as backup (also has a free tier)
    try {
      const apiKey = 'cju3it9r01qr958385t0cju3it9r01qr958385tg'; // Demo key, get your own from finnhub.io
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.c) { // Current price
          const price = data.c.toFixed(2);
          const changeAmount = data.d.toFixed(2); // Change
          const changePercent = data.dp.toFixed(2); // Percent change
          
          // Store the data in local storage for caching
          const stockData = { 
            price, 
            changePercent, 
            changeAmount,
            lastUpdated: new Date().toISOString(),
            market,
            currency
          };
          
          chrome.storage.local.get('stockData', (data) => {
            const allStockData = data.stockData || {};
            allStockData[symbol] = stockData;
            chrome.storage.local.set({ 'stockData': allStockData });
          });
          
          return { 
            success: true, 
            price, 
            changePercent,
            changeAmount: showChangeAmount ? changeAmount : null,
            currency,
            source: 'Finnhub'
          };
        }
      }
    } catch (error) {
      console.error('Finnhub API error:', error);
      // Continue to next API
    }
    
    // 3. Try Yahoo Finance API through a proxy (no API key needed but less reliable)
    try {
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result.length > 0) {
          const result = data.chart.result[0];
          const quote = result.meta;
          
          if (quote && quote.regularMarketPrice) {
            const price = quote.regularMarketPrice.toFixed(2);
            const previousClose = quote.previousClose || quote.chartPreviousClose;
            let changeAmount = 0;
            let changePercent = 0;
            
            if (previousClose) {
              changeAmount = (quote.regularMarketPrice - previousClose).toFixed(2);
              changePercent = ((changeAmount / previousClose) * 100).toFixed(2);
            }
            
            // Store the data in local storage for caching
            const stockData = { 
              price, 
              changePercent, 
              changeAmount,
              lastUpdated: new Date().toISOString(),
              market,
              currency
            };
            
            chrome.storage.local.get('stockData', (data) => {
              const allStockData = data.stockData || {};
              allStockData[symbol] = stockData;
              chrome.storage.local.set({ 'stockData': allStockData });
            });
            
            return { 
              success: true, 
              price, 
              changePercent,
              changeAmount: showChangeAmount ? changeAmount : null,
              currency,
              source: 'Yahoo Finance'
            };
          }
        }
      }
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      // Fall back to mock data
    }
    
    // 4. If all APIs fail, use mock data as a last resort
    console.warn(`All APIs failed for ${symbol}, using mock data`);
    return getFallbackStockData(symbol, currency);
    
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return getFallbackStockData(symbol, symbol.includes('.NS') ? 'INR' : 'USD');
  }
}

// Function to generate fallback data if all APIs fail
function getFallbackStockData(symbol, currency) {
  // Use a hash of the symbol to generate consistent prices for the same symbol
  const hash = symbol.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Generate a base price between 50 and 500
  const basePrice = (hash % 450) + 50;
  
  // Add some randomness but keep it within a reasonable range
  const randomFactor = Math.sin(Date.now() / 10000000) * 0.05; // Small fluctuation
  const price = (basePrice * (1 + randomFactor)).toFixed(2);
  
  // Generate change amount and percent
  const changeAmount = (basePrice * randomFactor).toFixed(2);
  const changePercent = (randomFactor * 100).toFixed(2);
  
  // For Indian stocks, make prices higher to be realistic in INR
  if (currency === 'INR') {
    const inrPrice = (parseFloat(price) * 75).toFixed(2); // Rough USD to INR conversion
    const inrChangeAmount = (parseFloat(changeAmount) * 75).toFixed(2);
    
    return {
      success: true,
      price: inrPrice,
      changeAmount: inrChangeAmount,
      changePercent: changePercent,
      currency: 'INR',
      source: 'Fallback Data'
    };
  }
  
  return {
    success: true,
    price,
    changeAmount,
    changePercent,
    currency: 'USD',
    source: 'Fallback Data'
  };
}

// Function to validate stock symbol
async function validateStockSymbol(symbol) {
  try {
    // Try to validate using Alpha Vantage API
    const apiKey = 'XOLA7URKCZHU7C9X'; // Demo key
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
    
    if (response.ok) {
      const data = await response.json();
      
      // Check if we got any matches
      if (data.bestMatches && data.bestMatches.length > 0) {
        // Find exact match or close match
        const exactMatch = data.bestMatches.find(match => 
          match['1. symbol'].toUpperCase() === symbol.toUpperCase()
        );
        
        if (exactMatch) {
          return true;
        }
        
        // If no exact match but we have results, it might be valid
        return data.bestMatches.length > 0;
      }
    }
    
    // If Alpha Vantage fails, try a basic validation
    // Check if it's a common stock format
    const validFormat = /^[A-Z0-9.]{1,10}(\.NS|\.BSE|\.BO)?$/.test(symbol);
    
    return validFormat;
  } catch (error) {
    console.error(`Error validating symbol ${symbol}:`, error);
    
    // Fall back to basic validation
    return /^[A-Z0-9.]{1,10}(\.NS|\.BSE|\.BO)?$/.test(symbol);
  }
}

// Listen for messages from popup and options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStocks') {
    updateStockPrices();
    sendResponse({ status: 'updating' });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'fetchStockPrice') {
    // Check if we have cached data less than X minutes old (from options)
    chrome.storage.sync.get('updateFrequency', function(options) {
      const cacheMinutes = options.updateFrequency || 5;
      
      chrome.storage.local.get('stockData', async (data) => {
        const allStockData = data.stockData || {};
        const cachedData = allStockData[message.symbol];
        
        const now = new Date();
        const cacheExpiryTime = new Date(now - cacheMinutes * 60 * 1000);
        
        // Use cached data if available and recent
        if (cachedData && new Date(cachedData.lastUpdated) > cacheExpiryTime) {
          sendResponse({
            success: true,
            price: cachedData.price,
            changePercent: cachedData.changePercent,
            changeAmount: cachedData.changeAmount,
            currency: cachedData.currency,
            cached: true,
            source: cachedData.source || 'Cached'
          });
        } else {
          // Fetch fresh data
          const result = await fetchStockPrice(message.symbol);
          sendResponse(result);
        }
      });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'validateSymbol') {
    validateStockSymbol(message.symbol).then(isValid => {
      sendResponse({ isValid });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'updateAlarmFrequency') {
    // Update the alarm frequency
    const frequency = message.frequency || 5;
    chrome.alarms.clear('updateStocks', () => {
      chrome.alarms.create('updateStocks', { periodInMinutes: frequency });
      sendResponse({ status: 'alarm updated' });
    });
    return true; // Keep the message channel open for async response
  }
});