/**
 * CNPI Hub — Landing Page Logic
 * Integração com Brapi API
 */

const ATIVOS = [
  { ticker: 'PETR4', name: 'Petrobras PN', sector: 'Petróleo & Gás' },
  { ticker: 'VALE3', name: 'Vale ON', sector: 'Mineração' },
];

let refreshInterval = null;
let lastUpdate = null;

const formatBRL = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatTime = (date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getChangeClass = (change) => (change >= 0 ? 'positive' : 'negative');
const getChangeSymbol = (change) => (change >= 0 ? '+' : '');

function createQuoteCard(ativo, data) {
  if (!data || !data.price) {
    return `<div class="quote-card"><div class="card-header"><div class="ticker-info"><span class="ticker-symbol">${ativo.ticker}</span><span class="ticker-name">${ativo.name}</span></div></div><div class="card-body"><div class="price-section">---</div></div></div>`;
  }

  const changeClass = getChangeClass(data.change);
  const changeSign = getChangeSymbol(data.change);
  const changePct = data.changePercent?.toFixed(2) || '0.00';

  return `
    <div class="quote-card ${changeClass}">
      <div class="card-header">
        <div class="ticker-info">
          <span class="ticker-symbol">${ativo.ticker}</span>
          <span class="ticker-name">${ativo.name}</span>
        </div>
        <span class="sector-badge">${ativo.sector}</span>
      </div>
      <div class="card-body">
        <div class="price-section">
          <span class="current-price">${formatBRL(data.price)}</span>
          <span class="variation ${changeClass}">${changeSign}${changePct}%</span>
        </div>
        <div class="price-details">
          <div class="detail-item">
            <span class="detail-label">Variação</span>
            <span class="detail-value ${changeClass}">${formatBRL(data.change || 0)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Volume</span>
            <span class="detail-value">${formatNumber(data.volume || 0)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Atualizado</span>
            <span class="detail-value">${formatTime(new Date(data.timestamp))}</span>
          </div>
        </div>
      </div>
      <div class="card-footer"><div class="price-bar" style="width: ${Math.min(100, Math.max(0, (data.changePercent || 0) + 50))}%"></div></div>
    </div>
  `;
}

function createOtherAssetCard(ticker, data) {
  if (!data || !data.price) return '';
  const changeClass = getChangeClass(data.change);
  const changeSign = getChangeSymbol(data.change);
  return `<div class="mini-card ${changeClass}"><span class="mini-ticker">${ticker}</span><span class="mini-price">${formatBRL(data.price)}</span><span class="mini-change ${changeClass}">${changeSign}${data.changePercent?.toFixed(2) || 0}%</span></div>`;
}

async function updateQuotes() {
  const grid = document.getElementById('quotes-grid');
  const otherGrid = document.getElementById('other-assets-grid');

  try {
    const tickers = ATIVOS.map(a => a.ticker);
    const quotes = await getQuotes(tickers);

    grid.innerHTML = ATIVOS.map((ativo, i) => createQuoteCard(ativo, quotes[i])).join('');

    const dolar = await getDolar();
    otherGrid.innerHTML = createOtherAssetCard('USD/BRL', dolar);

    lastUpdate = new Date();
    document.getElementById('last-update').textContent = formatTime(lastUpdate);
    document.getElementById('connection-status').classList.remove('error');
    document.querySelector('#connection-status .status-dot').style.background = 'var(--green)';
    console.log('✅ Cotações atualizadas:', quotes.map(q => q.ticker).join(', '));
  } catch (error) {
    console.error('Erro ao buscar cotações:', error);
    grid.innerHTML = '<div class="error-message">Erro ao carregar cotações. Tente novamente.</div>';
    document.getElementById('connection-status').classList.add('error');
    document.querySelector('#connection-status .status-dot').style.background = 'var(--red)';
  }
}

async function searchTicker() {
  const input = document.getElementById('ticker-input');
  const ticker = input.value.trim().toUpperCase();
  const result = document.getElementById('search-result');

  if (!ticker) return;

  result.innerHTML = '<div class="loading">🔍 Buscando...</div>';

  try {
    const data = await getQuote(ticker);
    const changeClass = getChangeClass(data.change);
    const changeSign = getChangeSymbol(data.change);

    result.innerHTML = `
      <div class="search-card ${changeClass}">
        <div class="search-header">
          <span class="search-ticker">${ticker}</span>
          <span class="search-price">${formatBRL(data.price)}</span>
        </div>
        <div class="search-change ${changeClass}">
          ${changeSign}${data.changePercent?.toFixed(2) || '0.00'}% (${formatBRL(data.change || 0)})
        </div>
        <div class="search-info">${data.name || 'Ativo encontrado'}</div>
      </div>
    `;
    console.log('🔍 Busca:', ticker, formatBRL(data.price));
  } catch (error) {
    result.innerHTML = `<div class="search-error"><span>❌ Ticker não encontrado ou erro na API</span><small>${error.message}</small></div>`;
  }
}

function manualRefresh() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('loading');
  updateQuotes().then(() => {
    setTimeout(() => btn.classList.remove('loading'), 500);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await updateQuotes();
  refreshInterval = setInterval(updateQuotes, 30000);

  document.getElementById('ticker-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchTicker();
  });

  document.getElementById('search-btn').addEventListener('click', searchTicker);
  document.getElementById('refresh-btn').addEventListener('click', manualRefresh);

  console.log('🚀 CNPI Hub carregado — Brapi API conectada');
  console.log('📊 Ativos:', ATIVOS.map(a => a.ticker).join(', '));
  console.log('🔄 Auto-refresh: 30s');
});

window.addEventListener('beforeunload', () => {
  if (refreshInterval) clearInterval(refreshInterval);
});
