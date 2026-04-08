/**
 * Brapi API Wrapper
 * Fonte: brapi.dev (gratuita, sem autenticação)
 * Cobre: Ações B3, FIIs, Dólar, Índices
 */

const BASE_URL = 'https://brapi.dev/api';

const cache = new Map();

function cacheKey(endpoint, params = {}) {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function isCacheValid(key, ttlSeconds = 30) {
  const entry = cache.get(key);
  if (!entry) return false;
  return (Date.now() - entry.timestamp) < (ttlSeconds * 1000);
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 'Accept': 'application/json', ...options.headers },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export async function getQuote(ticker) {
  ticker = ticker.toUpperCase().replace(/\.SA$/i, '');
  const cacheKey_ = cacheKey('quote', { ticker });
  if (isCacheValid(cacheKey_, 30)) return cache.get(cacheKey_).data;

  try {
    const data = await fetchWithRetry(`${BASE_URL}/quote/${ticker}?modules=summary`);
    const result = {
      ticker: data.results?.[0]?.symbol || ticker,
      name: data.results?.[0]?.name || '',
      price: data.results?.[0]?.regularMarketPrice || 0,
      change: data.results?.[0]?.regularMarketChange || 0,
      changePercent: data.results?.[0]?.regularMarketChangePercent || 0,
      volume: data.results?.[0]?.regularMarketVolume || 0,
      marketCap: data.results?.[0]?.marketCap || 0,
      currency: data.results?.[0]?.currency || 'BRL',
      timestamp: new Date().toISOString(),
    };
    cache.set(cacheKey_, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`Erro ao buscar cotação de ${ticker}:`, error.message);
    throw error;
  }
}

export async function getQuotes(tickers) {
  const uniqueTickers = [...new Set(tickers.map(t => t.toUpperCase().replace(/\.SA$/i, '')))];
  const results = await Promise.all(
    uniqueTickers.map(ticker => getQuote(ticker).catch(() => null))
  );
  return results.filter(r => r !== null);
}

export async function getHistory(ticker, start, end, interval = '1d') {
  ticker = ticker.toUpperCase().replace(/\.SA$/i, '');
  const cacheKey_ = cacheKey('history', { ticker, start, end, interval });
  if (isCacheValid(cacheKey_, 300)) return cache.get(cacheKey_).data;

  try {
    const data = await fetchWithRetry(`${BASE_URL}/quote/${ticker}?start=${start}&end=${end}&interval=${interval}`);
    const candles = (data.results?.[0]?.historicalDataPrice || []).map(c => ({
      date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume,
    }));
    cache.set(cacheKey_, { data: candles, timestamp: Date.now() });
    return candles;
  } catch (error) {
    console.error(`Erro ao buscar histórico de ${ticker}:`, error.message);
    throw error;
  }
}

export async function getFIIs() {
  const cacheKey_ = 'fiis_list';
  if (isCacheValid(cacheKey_, 3600)) return cache.get(cacheKey_).data;

  try {
    const data = await fetchWithRetry(`${BASE_URL}/fiis`);
    const fiis = (data.results || []).map(fii => ({
      ticker: fii.ticker, name: fii.name, type: fii.type, sector: fii.sector, segment: fii.segment,
    }));
    cache.set(cacheKey_, { data: fiis, timestamp: Date.now() });
    return fiis;
  } catch (error) {
    console.error('Erro ao buscar lista de FIIs:', error.message);
    throw error;
  }
}

export async function getFII(ticker) {
  ticker = ticker.toUpperCase().replace(/\.SA$/i, '');
  try {
    const [quote, fiis] = await Promise.all([getQuote(ticker), getFIIs()]);
    const fiiInfo = fiis.find(f => f.ticker === ticker);
    return { ...quote, ...fiiInfo, dividendYield: fiiInfo?.dividendYield || null, lastDividend: fiiInfo?.lastDividend || null, liquid: fiiInfo?.liquid || null };
  } catch (error) {
    console.error(`Erro ao buscar dados do FII ${ticker}:`, error.message);
    throw error;
  }
}

export async function getStocks(sector = null) {
  try {
    const endpoint = sector ? `${BASE_URL}/stocks?sector=${encodeURIComponent(sector)}` : `${BASE_URL}/stocks`;
    const data = await fetchWithRetry(endpoint);
    return (data.results || []).map(stock => ({
      ticker: stock.ticker, name: stock.name, type: stock.type, sector: stock.sector, segment: stock.segment,
    }));
  } catch (error) {
    console.error('Erro ao buscar ações:', error.message);
    throw error;
  }
}

export async function getDolar() { return getQuote('BRL=X'); }

export async function getIndices(symbols = ['^BVSP', '^GSPC']) { return getQuotes(symbols); }

export function clearCache() { cache.clear(); }
export function getCacheStats() { return { size: cache.size, keys: Array.from(cache.keys()) }; }

export async function safeGetQuotes(tickers) {
  const results = {};
  const errors = {};
  await Promise.all(tickers.map(async ticker => {
    try { results[ticker] = await getQuote(ticker); }
    catch (e) { errors[ticker] = e.message; }
  }));
  return { results, errors, success: Object.keys(results).length };
}
