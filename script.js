// Audio Commands Setup
if (annyang) {
    const commands = {
        'hello': function() {
            alert('Hello World!');
        },
        'change the color to *color': function(color) {
            document.body.style.backgroundColor = color;
        },
        'navigate to *page': function(page) {
            page = page.toLowerCase();
            if (['home', 'stocks', 'dogs'].includes(page)) {
                window.location.href = page === 'home' ? 'index.html' : `${page}.html`;
            }
        },
        'lookup *stock': function(stock) {
            if (window.location.pathname.includes('stocks.html')) {
                document.getElementById('stockTicker').value = stock.toUpperCase();
                lookupStock();
            }
        },
        'load dog breed *breed': function(breed) {
            if (window.location.pathname.includes('dogs.html')) {
                loadBreedInfo(breed);
            }
        }
    };

    annyang.addCommands(commands);
}

function updateButtonStates() {
    const isListening = localStorage.getItem('voiceListening') === 'true';
    const startBtn = document.getElementById('startListeningBtn');
    const stopBtn = document.getElementById('stopListeningBtn');
    
    if (startBtn && stopBtn) {
        startBtn.disabled = isListening;
        stopBtn.disabled = !isListening;
    }
}

function startListening() {
    if (annyang) {
        annyang.start();
        localStorage.setItem('voiceListening', 'true');
        updateButtonStates();
    }
}

function stopListening() {
    if (annyang) {
        annyang.abort();
        localStorage.setItem('voiceListening', 'false');
        updateButtonStates();
    }
}

// Home Page Quote
async function loadQuote() {
    const response = await fetch('https://zenquotes.io/api/quotes');
    const data = await response.json();
    const quote = data[0];
    document.getElementById('quote').textContent = quote.q + ' - ' + quote.a;
}

// Stocks Page
async function lookupStock() {
    
    const ticker = document.getElementById('stockTicker').value.toUpperCase();
    if (!ticker) {
        alert('Please enter a stock ticker');
        return;
    }

    const days = document.getElementById('timeRange').value;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.querySelector('.chart-container').style.display = 'block';
    
    const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?apiKey=3tvGanzRHGIpp5Q2o3WSGWLQYiQmFH75`);
    const data = await response.json();

    const ctx = document.getElementById('stockChart').getContext('2d');
    if (window.stockChart instanceof Chart) {
        window.stockChart.destroy();
    }
    
    window.stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.results.map(result => new Date(result.t).toLocaleDateString()),
            datasets: [{
                label: `${ticker} Stock Price`,
                data: data.results.map(result => result.c),
                borderColor: 'teal'
            }]
        },
        options: {
            maintainAspectRatio: false
        }
    });
}

async function loadRedditStocks() {

    const response = await fetch('https://tradestie.com/api/v1/apps/reddit?date=2022-04-03');
    const stocks = await response.json();
    const top5 = stocks.sort((a, b) => b.no_of_comments - a.no_of_comments).slice(0, 5);
    
    const tbody = document.querySelector('#redditStocks tbody');
    tbody.innerHTML = top5.map(stock => `
        <tr>
            <td><a href="https://finance.yahoo.com/quote/${stock.ticker}">${stock.ticker}</a></td>
            <td>${stock.no_of_comments}</td>
            <td>${stock.sentiment === 'Bullish' ? '📈 🐂' : '📉 🐻'}</td>
        </tr>
    `).join('');
}

async function loadDogImages() {
    const carousel = document.getElementById('dogCarousel');

    const response = await fetch('https://dog.ceo/api/breeds/image/random/10');
    const data = await response.json();
    
    carousel.innerHTML = data.message.map(url => 
        `<img src="${url}" alt="Random Dog" style="position: absolute; width: 100%; height: 100%; object-fit: cover;">`
    ).join('');

    simpleslider.getSlider({
        container: carousel,
        prop: 'left',
        show: 0,
        end: 100,
        unit: '%',
        delay: 2,
        duration: 1
    });
}

async function loadBreedButtons() {

    const response = await fetch('https://dogapi.dog/api/v2/breeds');
    const data = await response.json();
    const breeds = data.data.slice(0, 10).map(breed => breed.attributes.name);
    
    const container = document.getElementById('breedButtons');
    container.innerHTML = breeds.map(breed => 
        `<button class="button" onclick="loadBreedInfo('${breed}')">${breed}</button>`
    ).join('');
}

async function loadBreedInfo(breed) {

    const response = await fetch('https://dogapi.dog/api/v2/breeds');
    const data = await response.json();
    const breedInfo = data.data.find(b => b.attributes.name.toLowerCase() === breed.toLowerCase());
    
    if (breedInfo) {
        const info = breedInfo.attributes;
        document.getElementById('breedInfo').style.display = 'block';
        document.getElementById('breedInfo').innerHTML = `
            <h2>${info.name}</h2>
            <p>${info.description}</p>
            <p>Min Life: ${info.life.min} years</p>
            <p>Max Life: ${info.life.max} years</p>
        `;
    }
}

// Check and restore listening state on page load
document.addEventListener('DOMContentLoaded', () => {
    if (annyang && localStorage.getItem('voiceListening') === 'true') {
        annyang.start();
    }
    updateButtonStates();
    
    if (window.location.pathname.includes('stocks.html')) {
        loadRedditStocks();
    }
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadQuote();
    }
    if (window.location.pathname.includes('dogs.html')) {
        loadDogImages();
        loadBreedButtons();
    }
});