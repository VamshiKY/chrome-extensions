// Stock symbol autosuggest functionality

// Common stock symbols and their names for autosuggest
const commonStocks = [
  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', market: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', market: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', market: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', market: 'NYSE' },
  
  // Indian Stocks
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', market: 'NSE' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', market: 'NSE' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', market: 'NSE' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd.', market: 'NSE' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', market: 'NSE' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd.', market: 'NSE' },
  { symbol: 'NATCOPHARM.NS', name: 'Natco Pharma Ltd.', market: 'NSE' },
  { symbol: 'KITEX.NS', name: 'Kitex Garments Ltd.', market: 'NSE' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd.', market: 'NSE' },
  { symbol: 'WIPRO.NS', name: 'Wipro Ltd.', market: 'NSE' }
];

// Function to initialize autosuggest
function initializeAutosuggest(inputElement, suggestionsContainer) {
  // Create suggestions container if it doesn't exist
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.style.position = 'absolute';
    suggestionsContainer.style.width = '280px';
    suggestionsContainer.style.maxHeight = '250px';
    suggestionsContainer.style.overflowY = 'auto';
    suggestionsContainer.style.backgroundColor = 'white';
    suggestionsContainer.style.border = '1px solid #ddd';
    suggestionsContainer.style.borderRadius = '4px';
    suggestionsContainer.style.zIndex = '1000';
    suggestionsContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    suggestionsContainer.style.marginTop = '2px';
    
    // Insert after the input element
    inputElement.parentNode.insertBefore(suggestionsContainer, inputElement.nextSibling);
  }
  
  // Keep track of all stocks including user-added ones
  let allStocks = [...commonStocks];
  
  // Function to show suggestions based on input
  function showSuggestions(input) {
    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';
    
    if (!input || input.length < 1) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    // Filter stocks based on input (match symbol or name)
    const filteredStocks = allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(input.toLowerCase()) || 
      stock.name.toLowerCase().includes(input.toLowerCase())
    );
    
    // Sort results: exact matches first, then by relevance
    filteredStocks.sort((a, b) => {
      // Exact symbol match gets highest priority
      if (a.symbol.toLowerCase() === input.toLowerCase()) return -1;
      if (b.symbol.toLowerCase() === input.toLowerCase()) return 1;
      
      // Then check if symbol starts with input
      const aStartsWithSymbol = a.symbol.toLowerCase().startsWith(input.toLowerCase());
      const bStartsWithSymbol = b.symbol.toLowerCase().startsWith(input.toLowerCase());
      if (aStartsWithSymbol && !bStartsWithSymbol) return -1;
      if (!aStartsWithSymbol && bStartsWithSymbol) return 1;
      
      // Then check if name starts with input
      const aStartsWithName = a.name.toLowerCase().startsWith(input.toLowerCase());
      const bStartsWithName = b.name.toLowerCase().startsWith(input.toLowerCase());
      if (aStartsWithName && !bStartsWithName) return -1;
      if (!aStartsWithName && bStartsWithName) return 1;
      
      // Finally sort alphabetically by symbol
      return a.symbol.localeCompare(b.symbol);
    });
    
    // Limit to top 10 results for better performance
    const limitedResults = filteredStocks.slice(0, 10);
    
    if (limitedResults.length === 0) {
      // Show "no results" message with option to add as custom symbol
      const noResults = document.createElement('div');
      noResults.className = 'suggestion-item no-results';
      noResults.style.padding = '10px 12px';
      noResults.style.color = '#666';
      noResults.style.fontSize = '13px';
      noResults.style.borderBottom = '1px solid #eee';
      
      noResults.innerHTML = `
        <div>No matches found for "${input}"</div>
        <div style="margin-top: 5px; font-size: 12px;">
          Press Enter to add as custom symbol
        </div>
      `;
      
      suggestionsContainer.appendChild(noResults);
      suggestionsContainer.style.display = 'block';
      return;
    }
    
    // Create suggestion items
    limitedResults.forEach((stock, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.style.padding = '10px 12px';
      item.style.cursor = 'pointer';
      item.style.borderBottom = '1px solid #eee';
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.transition = 'background-color 0.2s';
      
      // First item is active by default
      if (index === 0) {
        item.classList.add('active');
        item.style.backgroundColor = '#f5f5f5';
      }
      
      // Highlight the matching part
      const symbolIndex = stock.symbol.toLowerCase().indexOf(input.toLowerCase());
      const nameIndex = stock.name.toLowerCase().indexOf(input.toLowerCase());
      
      let symbolHtml = stock.symbol;
      let nameHtml = stock.name;
      
      if (symbolIndex !== -1) {
        symbolHtml = 
          stock.symbol.substring(0, symbolIndex) + 
          '<strong>' + stock.symbol.substring(symbolIndex, symbolIndex + input.length) + '</strong>' + 
          stock.symbol.substring(symbolIndex + input.length);
      }
      
      if (nameIndex !== -1) {
        nameHtml = 
          stock.name.substring(0, nameIndex) + 
          '<strong>' + stock.name.substring(nameIndex, nameIndex + input.length) + '</strong>' + 
          stock.name.substring(nameIndex + input.length);
      }
      
      // Add market indicator
      const marketIndicator = stock.market === 'NSE' || stock.market === 'BSE' ? ' (Rs)' : ' ($)';
      
      // Create a more visually appealing layout
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">${symbolHtml}</span>
          <span style="color: #666; font-size: 12px;">${marketIndicator}</span>
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 2px;">${nameHtml}</div>
      `;
      
      // Handle click on suggestion
      item.addEventListener('click', () => {
        inputElement.value = stock.symbol;
        suggestionsContainer.style.display = 'none';
        // Trigger input event to update validation
        inputElement.dispatchEvent(new Event('input'));
        // Focus on input to allow immediate submission
        inputElement.focus();
      });
      
      // Hover effect
      item.addEventListener('mouseenter', () => {
        // Remove active class from all items
        document.querySelectorAll('.suggestion-item').forEach(el => {
          el.classList.remove('active');
          el.style.backgroundColor = 'transparent';
        });
        
        // Add active class to this item
        item.classList.add('active');
        item.style.backgroundColor = '#f5f5f5';
      });
      
      suggestionsContainer.appendChild(item);
    });
    
    // Add a "Powered by" footer
    const footer = document.createElement('div');
    footer.style.padding = '6px 12px';
    footer.style.fontSize = '10px';
    footer.style.color = '#999';
    footer.style.textAlign = 'right';
    footer.style.borderTop = '1px solid #eee';
    footer.textContent = 'Press ↑↓ to navigate, Enter to select';
    suggestionsContainer.appendChild(footer);
    
    // Position the suggestions container
    positionSuggestions();
    
    // Show suggestions
    suggestionsContainer.style.display = 'block';
  }
  
  // Position the suggestions container
  function positionSuggestions() {
    const inputRect = inputElement.getBoundingClientRect();
    suggestionsContainer.style.width = inputRect.width + 'px';
    suggestionsContainer.style.left = '0';
    suggestionsContainer.style.top = (inputElement.offsetHeight + 2) + 'px';
  }
  
  // Input event listener with debounce
  let debounceTimer;
  inputElement.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSuggestions(inputElement.value);
    }, 150); // 150ms debounce
  });
  
  // Focus event listener
  inputElement.addEventListener('focus', () => {
    if (inputElement.value) {
      showSuggestions(inputElement.value);
    }
  });
  
  // Click outside to close suggestions
  document.addEventListener('click', (event) => {
    if (!inputElement.contains(event.target) && !suggestionsContainer.contains(event.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  // Keyboard navigation
  inputElement.addEventListener('keydown', (event) => {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    const activeItem = suggestionsContainer.querySelector('.suggestion-item.active');
    let activeIndex = -1;
    
    // Find current active index
    if (activeItem) {
      for (let i = 0; i < items.length; i++) {
        if (items[i] === activeItem) {
          activeIndex = i;
          break;
        }
      }
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (suggestionsContainer.style.display === 'none') {
          showSuggestions(inputElement.value);
        } else {
          if (activeItem) {
            activeItem.classList.remove('active');
            activeItem.style.backgroundColor = 'transparent';
          }
          activeIndex = (activeIndex + 1) % items.length;
          items[activeIndex].classList.add('active');
          items[activeIndex].style.backgroundColor = '#f5f5f5';
          items[activeIndex].scrollIntoView({ block: 'nearest' });
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (suggestionsContainer.style.display !== 'none') {
          if (activeItem) {
            activeItem.classList.remove('active');
            activeItem.style.backgroundColor = 'transparent';
          }
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          items[activeIndex].classList.add('active');
          items[activeIndex].style.backgroundColor = '#f5f5f5';
          items[activeIndex].scrollIntoView({ block: 'nearest' });
        }
        break;
        
      case 'Enter':
        if (suggestionsContainer.style.display !== 'none') {
          event.preventDefault();
          if (activeItem) {
            // If it's a "no results" item, use the input value as is
            if (activeItem.classList.contains('no-results')) {
              // Keep the current input value
              suggestionsContainer.style.display = 'none';
              // Trigger the add stock button
              document.getElementById('addStock').click();
            } else {
              // Extract the symbol from the active item
              const symbolElement = activeItem.querySelector('span:first-child');
              const symbol = symbolElement.textContent.replace(/<\/?strong>/g, '');
              inputElement.value = symbol;
              suggestionsContainer.style.display = 'none';
            }
          }
        }
        break;
        
      case 'Escape':
        suggestionsContainer.style.display = 'none';
        break;
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (suggestionsContainer.style.display !== 'none') {
      positionSuggestions();
    }
  });
  
  // Load user's previously added stocks
  function loadUserStocks() {
    chrome.storage.sync.get('stocks', function(data) {
      if (data.stocks && Array.isArray(data.stocks)) {
        updateSuggestions(data.stocks.map(symbol => {
          // Determine market based on symbol suffix
          let market = 'NASDAQ';
          if (symbol.endsWith('.NS')) {
            market = 'NSE';
          } else if (symbol.endsWith('.BO') || symbol.endsWith('.BSE')) {
            market = 'BSE';
          }
          
          return {
            symbol: symbol,
            name: `User added: ${symbol}`,
            market: market
          };
        }));
      }
    });
  }
  
  // Load user stocks on initialization
  loadUserStocks();
  
  // Function to update suggestions with new stocks
  function updateSuggestions(newStocks) {
    if (!newStocks || !Array.isArray(newStocks)) return;
    
    // Add new stocks to the suggestions list if they don't already exist
    newStocks.forEach(stock => {
      if (!allStocks.some(s => s.symbol === stock.symbol)) {
        allStocks.push(stock);
      }
    });
  }
  
  // Fetch popular stocks dynamically from an API
  async function fetchPopularStocks() {
    try {
      // This would normally be an API call, but we'll use a timeout to simulate
      // In a real extension, you would fetch from a real API
      setTimeout(() => {
        const popularStocks = [
          { symbol: 'NFLX', name: 'Netflix, Inc.', market: 'NASDAQ' },
          { symbol: 'DIS', name: 'The Walt Disney Company', market: 'NYSE' },
          { symbol: 'ADBE', name: 'Adobe Inc.', market: 'NASDAQ' },
          { symbol: 'TATASTEEL.NS', name: 'Tata Steel Ltd.', market: 'NSE' },
          { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd.', market: 'NSE' }
        ];
        
        updateSuggestions(popularStocks);
      }, 2000); // Simulate API delay
    } catch (error) {
      console.error('Error fetching popular stocks:', error);
    }
  }
  
  // Fetch popular stocks on initialization
  fetchPopularStocks();
  
  return {
    updateSuggestions,
    showSuggestions
  };
}