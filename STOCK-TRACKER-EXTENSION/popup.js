document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const stockList = document.getElementById('stockList');
  const newStockInput = document.getElementById('newStock');
  const addStockButton = document.getElementById('addStock');
  const refreshButton = document.getElementById('refresh');
  const errorMessage = document.getElementById('error');
  
  // Initialize autosuggest
  const autosuggest = initializeAutosuggest(newStockInput);
  
  // Default stocks to track
  const defaultStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NATCOPHARM.NS', 'KITEX.NS', 'KOTAKBANK.NS'];
  
  // Load saved stocks or use defaults
  function loadStocks() {
    chrome.storage.sync.get('stocks', function(data) {
      const stocks = data.stocks || defaultStocks;
      if (!data.stocks) {
        // Save default stocks if no stocks are saved
        chrome.storage.sync.set({ 'stocks': defaultStocks });
      }
      fetchStockPrices(stocks);
      updateLastUpdatedTime();
      
      // Update autosuggest with recently added stocks
      updateAutosuggestWithRecentStocks();
    });
  }
  
  // Update the last updated timestamp
  function updateLastUpdatedTime() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    chrome.storage.local.get('lastUpdated', function(data) {
      if (data.lastUpdated) {
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastUpdated) / (1000 * 60));
        
        if (diffMinutes < 1) {
          lastUpdatedElement.textContent = 'Updated just now';
        } else if (diffMinutes === 1) {
          lastUpdatedElement.textContent = 'Updated 1 minute ago';
        } else if (diffMinutes < 60) {
          lastUpdatedElement.textContent = `Updated ${diffMinutes} minutes ago`;
        } else {
          const hours = Math.floor(diffMinutes / 60);
          lastUpdatedElement.textContent = `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
      } else {
        lastUpdatedElement.textContent = 'Not updated yet';
      }
    });
  }
  
  // Fetch stock prices from Google Finance
  function fetchStockPrices(stocks) {
    stockList.innerHTML = ''; // Clear the list
    
    if (stocks.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'stock-item';
      emptyMessage.innerHTML = '<span class="stock-symbol">No stocks added yet</span><span class="stock-price"></span><span style="width: 22px;"></span>';
      stockList.appendChild(emptyMessage);
      return;
    }
    
    stocks.forEach(symbol => {
      // Create a placeholder for each stock
      const stockItem = document.createElement('div');
      stockItem.className = 'stock-item';
      
      // Add currency indicator based on symbol suffix
      let currencyIndicator = '$';
      if (symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol.endsWith('.BSE')) {
        currencyIndicator = 'Rs';
      }
      
      stockItem.innerHTML = `
        <span class="stock-symbol">${symbol} <span class="currency-indicator">${currencyIndicator}</span></span>
        <span class="stock-price">Loading...</span>
        <button class="remove-stock" data-symbol="${symbol}" title="Remove ${symbol}">×</button>
      `;
      stockList.appendChild(stockItem);
      
      // Fetch real stock data
      fetchRealStockPrice(symbol, stockItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-stock').forEach(button => {
      button.addEventListener('click', function() {
        removeStock(this.getAttribute('data-symbol'));
      });
    });
  }
  
  // Fetch real stock price from API
  function fetchRealStockPrice(symbol, stockItem) {
    const priceElement = stockItem.querySelector('.stock-price');
    
    // Show loading state with animation
    priceElement.innerHTML = `
      <div class="loading-price">
        <div></div><div></div><div></div><div></div>
      </div>
    `;
    
    // Send message to background script to fetch the stock price
    chrome.runtime.sendMessage(
      { action: 'fetchStockPrice', symbol: symbol },
      (response) => {
        if (response && response.success) {
          // Update UI with real stock data
          const { price, changePercent, changeAmount, currency } = response;
          
          // Get currency symbol based on the currency code
          const currencySymbol = currency === 'INR' ? 'Rs' : '$';
          
          // Format the price display based on options
          let priceText = `${currencySymbol}${price} (${changePercent > 0 ? '+' : ''}${changePercent}%)`;
          
          // Add change amount if available and enabled
          if (changeAmount !== null) {
            priceText = `${currencySymbol}${price} (${changeAmount > 0 ? '+' : ''}${currencySymbol}${Math.abs(changeAmount)} / ${changePercent > 0 ? '+' : ''}${changePercent}%)`;
          }
          
          priceElement.textContent = priceText;
          
          // Add color based on change direction
          priceElement.className = 'stock-price'; // Reset classes
          if (parseFloat(changePercent) > 0) {
            priceElement.classList.add('positive');
          } else if (parseFloat(changePercent) < 0) {
            priceElement.classList.add('negative');
          }
          
          // Add a small indicator if data is cached
          if (response.cached) {
            priceElement.title = 'Cached data';
          }
          
          // Add source if available
          if (response.source) {
            priceElement.title = `Data from ${response.source}`;
            
            // Add a small indicator for the data source
            const sourceIndicator = document.createElement('small');
            sourceIndicator.style.fontSize = '9px';
            sourceIndicator.style.color = '#999';
            sourceIndicator.style.display = 'block';
            sourceIndicator.style.marginTop = '2px';
            sourceIndicator.textContent = response.source;
            priceElement.appendChild(sourceIndicator);
          }
        } else {
          // Handle error
          priceElement.textContent = 'Error fetching data';
          priceElement.classList.add('negative');
          priceElement.title = response.error || 'Unknown error';
        }
      }
    );
  }
  
  // Add a new stock
  function addStock(symbol) {
    // Basic validation
    if (!symbol || symbol.trim() === '') {
      showError('Please enter a stock symbol');
      return;
    }
    
    symbol = symbol.trim().toUpperCase();
    
    chrome.storage.sync.get('stocks', function(data) {
      let stocks = data.stocks || [];
      
      // Check if stock already exists
      if (stocks.includes(symbol)) {
        showError('Stock already in your list');
        return;
      }
      
      // Show loading state
      newStockInput.disabled = true;
      addStockButton.disabled = true;
      addStockButton.textContent = 'Validating...';
      
      // Validate the stock symbol with Yahoo Finance
      chrome.runtime.sendMessage(
        { action: 'validateSymbol', symbol: symbol },
        (response) => {
          if (response && response.isValid) {
            // Add new stock
            stocks.push(symbol);
            chrome.storage.sync.set({ 'stocks': stocks }, function() {
              // Clear input and refresh list
              newStockInput.value = '';
              fetchStockPrices(stocks);
              hideError();
              
              // Notify background script to update
              chrome.runtime.sendMessage({ action: 'updateStocks' });
              
              // Update autosuggest with the new stock
              updateAutosuggestWithRecentStocks();
            });
          } else {
            showError('Invalid stock symbol or unable to fetch data');
          }
          
          // Reset UI
          newStockInput.disabled = false;
          addStockButton.disabled = false;
          addStockButton.textContent = 'Add';
        }
      );
    });
  }
  
  // Remove a stock
  function removeStock(symbol) {
    chrome.storage.sync.get('stocks', function(data) {
      let stocks = data.stocks || [];
      stocks = stocks.filter(s => s !== symbol);
      
      chrome.storage.sync.set({ 'stocks': stocks }, function() {
        fetchStockPrices(stocks);
      });
    });
  }
  
  // Function to update autosuggest with recently added stocks
  function updateAutosuggestWithRecentStocks() {
    chrome.storage.sync.get('stocks', function(data) {
      const stocks = data.stocks || [];
      const recentStocks = stocks.map(symbol => {
        // Determine market based on symbol suffix
        let market = 'NASDAQ';
        if (symbol.endsWith('.NS')) {
          market = 'NSE';
        } else if (symbol.endsWith('.BO') || symbol.endsWith('.BSE')) {
          market = 'BSE';
        }
        
        return {
          symbol: symbol,
          name: symbol, // We don't have the name, so use symbol as name
          market: market
        };
      });
      
      // Update autosuggest with recent stocks
      if (autosuggest && autosuggest.updateSuggestions) {
        autosuggest.updateSuggestions(recentStocks);
      }
    });
  }
  
  // Show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
  
  // Hide error message
  function hideError() {
    errorMessage.style.display = 'none';
  }
  
  // Event listeners
  addStockButton.addEventListener('click', function() {
    addStock(newStockInput.value);
  });
  
  newStockInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addStock(newStockInput.value);
    }
  });
  
  refreshButton.addEventListener('click', function() {
    // Show loading state
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing...';
    
    // Clear any cached data to force fresh fetch
    chrome.storage.local.remove('stockData', function() {
      loadStocks();
      
      // Reset button after a short delay
      setTimeout(() => {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Refresh';
      }, 1000);
    });
  });
  
  // Initial load
  loadStocks();
});