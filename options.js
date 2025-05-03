document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const defaultStocksList = document.getElementById('defaultStocks');
  const newDefaultStockInput = document.getElementById('newDefaultStock');
  const addDefaultStockButton = document.getElementById('addDefaultStock');
  const updateFrequencySelect = document.getElementById('updateFrequency');
  const showBadgeCheckbox = document.getElementById('showBadge');
  const showChangeAmountCheckbox = document.getElementById('showChangeAmount');
  const defaultMarketSelect = document.getElementById('defaultMarket');
  const saveButton = document.getElementById('saveOptions');
  const statusDiv = document.getElementById('status');
  
  // Load saved options
  function loadOptions() {
    chrome.storage.sync.get({
      // Default values
      defaultStocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NATCOPHARM.NS', 'KITEX.NS', 'KOTAKBANK.NS'],
      updateFrequency: 5,
      showBadge: true,
      showChangeAmount: true,
      defaultMarket: 'NASDAQ'
    }, function(items) {
      // Populate default stocks list
      displayDefaultStocks(items.defaultStocks);
      
      // Set form values
      updateFrequencySelect.value = items.updateFrequency;
      showBadgeCheckbox.checked = items.showBadge;
      showChangeAmountCheckbox.checked = items.showChangeAmount;
      defaultMarketSelect.value = items.defaultMarket;
    });
  }
  
  // Display default stocks
  function displayDefaultStocks(stocks) {
    defaultStocksList.innerHTML = '';
    
    stocks.forEach(function(symbol) {
      const stockItem = document.createElement('div');
      stockItem.className = 'stock-item';
      stockItem.innerHTML = `
        <span>${symbol}</span>
        <button class="remove-stock" data-symbol="${symbol}">Remove</button>
      `;
      defaultStocksList.appendChild(stockItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-stock').forEach(button => {
      button.addEventListener('click', function() {
        removeDefaultStock(this.getAttribute('data-symbol'));
      });
    });
  }
  
  // Add a default stock
  function addDefaultStock() {
    const symbol = newDefaultStockInput.value.trim().toUpperCase();
    
    if (!symbol) {
      showStatus('Please enter a stock symbol', false);
      return;
    }
    
    chrome.storage.sync.get('defaultStocks', function(data) {
      let stocks = data.defaultStocks || [];
      
      // Check if stock already exists
      if (stocks.includes(symbol)) {
        showStatus('Stock already in default list', false);
        return;
      }
      
      // Validate the stock symbol
      chrome.runtime.sendMessage(
        { action: 'validateSymbol', symbol: symbol },
        (response) => {
          if (response && response.isValid) {
            // Add new stock to defaults
            stocks.push(symbol);
            chrome.storage.sync.set({ 'defaultStocks': stocks }, function() {
              newDefaultStockInput.value = '';
              displayDefaultStocks(stocks);
              showStatus('Default stock added', true);
            });
          } else {
            showStatus('Invalid stock symbol', false);
          }
        }
      );
    });
  }
  
  // Remove a default stock
  function removeDefaultStock(symbol) {
    chrome.storage.sync.get('defaultStocks', function(data) {
      let stocks = data.defaultStocks || [];
      stocks = stocks.filter(s => s !== symbol);
      
      chrome.storage.sync.set({ 'defaultStocks': stocks }, function() {
        displayDefaultStocks(stocks);
        showStatus('Default stock removed', true);
      });
    });
  }
  
  // Save options
  function saveOptions() {
    const updateFrequency = parseInt(updateFrequencySelect.value);
    const showBadge = showBadgeCheckbox.checked;
    const showChangeAmount = showChangeAmountCheckbox.checked;
    const defaultMarket = defaultMarketSelect.value;
    
    chrome.storage.sync.set({
      updateFrequency: updateFrequency,
      showBadge: showBadge,
      showChangeAmount: showChangeAmount,
      defaultMarket: defaultMarket
    }, function() {
      // Update alarm frequency if changed
      chrome.storage.sync.get('updateFrequency', function(data) {
        if (data.updateFrequency !== updateFrequency) {
          chrome.runtime.sendMessage({ 
            action: 'updateAlarmFrequency', 
            frequency: updateFrequency 
          });
        }
      });
      
      showStatus('Options saved', true);
    });
  }
  
  // Show status message
  function showStatus(message, success) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (success ? 'success' : 'error');
    statusDiv.style.display = 'block';
    
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 3000);
  }
  
  // Event listeners
  addDefaultStockButton.addEventListener('click', addDefaultStock);
  
  newDefaultStockInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDefaultStock();
    }
  });
  
  saveButton.addEventListener('click', saveOptions);
  
  // Initialize
  loadOptions();
});