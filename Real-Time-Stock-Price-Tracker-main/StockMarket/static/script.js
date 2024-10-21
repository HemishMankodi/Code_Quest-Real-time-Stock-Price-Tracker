// Retrieve tickers from localStorage or initialize an empty array
var tickers = JSON.parse(localStorage.getItem('tickers')) || [];
var lastPrices = {};
var counter = 15;

// Start the update cycle for fetching stock data every 15 seconds
function startUpdateCycle() {
    updatePrices();
    setInterval(function() {
        counter--;
        $('#counter').text(counter);
        if (counter <= 0) {
            updatePrices();
            counter = 15;
        }
    }, 1000);
}

$(document).ready(function () {
    // Add any previously saved tickers to the grid
    tickers.forEach(function(ticker) {
        addTickerToGrid(ticker);
    });
    updatePrices();

    // Handle form submission to add a new ticker
    $('#add-ticker-form').submit(function(e) {
        e.preventDefault();
        var newTicker = $('#new-ticker').val().toUpperCase();
        if (!tickers.includes(newTicker)) {
            tickers.push(newTicker);
            localStorage.setItem('tickers', JSON.stringify(tickers));
            addTickerToGrid(newTicker);
        }
        $('#new-ticker').val('');  // Clear the input
        updatePrices();
    });

    // Handle ticker removal
    $('#ticker-grid').on('click', '.remove-btn', function() {
        var tickerToRemove = $(this).data('ticker');
        tickers = tickers.filter(t => t !== tickerToRemove);
        localStorage.setItem('tickers', JSON.stringify(tickers));
        $('#' + tickerToRemove).remove();
    });

    // Start the update cycle for stock prices
    startUpdateCycle();
});

// Function to add ticker boxes to the grid
function addTickerToGrid(ticker) {
    $('#ticker-grid').append(`<div id="${ticker}" class="stock-box">
        <h2>${ticker}</h2>
        <p>Current Price: <span id="${ticker}-price"></span></p>
        <p>Opening Price: <span id="${ticker}-open"></span></p>
        <button class="remove-btn" data-ticker="${ticker}">Remove</button>
    </div>`);
}

// Function to update prices for each ticker
function updatePrices() {
    tickers.forEach(function(ticker) {
        $.ajax({
            url: '/get_stock_data', // API endpoint to get stock data
            type: 'POST',
            data: JSON.stringify({'ticker': ticker}),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function(data) {
                // Calculate price movement (up or down)
                var changePercent = ((data.currentPrice - data.openPrice) / data.openPrice) * 100;
                var colorClass;

                // Set background color based on price movement
                if (data.currentPrice > data.openPrice) {
                    colorClass = 'green';  // Green for price increase
                } else if (data.currentPrice < data.openPrice) {
                    colorClass = 'red';  // Red for price decrease
                } else {
                    colorClass = 'gray';  // Gray for no change
                }

                // Update the ticker box with current price and opening price
                $(`#${ticker}-price`).text(`$${data.currentPrice.toFixed(2)}`);
                $(`#${ticker}-open`).text(`$${data.openPrice.toFixed(2)}`);

                // Apply color class to the entire stock box for the background color
                $(`#${ticker}`).removeClass('green red gray').addClass(colorClass);

                // Flash the background when the price changes
                var flashClass;
                if (lastPrices[ticker] > data.currentPrice) {
                    flashClass = "red-flash";
                } else if (lastPrices[ticker] < data.currentPrice) {
                    flashClass = "green-flash";
                } else {
                    flashClass = "gray-flash";
                }
                lastPrices[ticker] = data.currentPrice;

                // Add flash effect for 1 second
                $(`#${ticker}`).addClass(flashClass);
                setTimeout(function() {
                    $(`#${ticker}`).removeClass(flashClass);
                }, 1000);
            }
        });
    });
}
