# CNPI Hub — Cotações em Tempo Real

Landing page com cotações da B3 (PETR4, VALE3) em tempo real, usando a API gratuita do Brapi.

## 📦 Estrutura

```
cnpi-dashboard/
├── index.html      # Página principal
├── style.css       # Design system (dark mode)
├── script.js       # Lógica da aplicação
├── brapi.js        # Wrapper da API Brapi
└── README.md       # Este arquivo
```

## 🚀 Deploy no GitHub Pages

1. Crie um repositório no GitHub (ex: `cnpi-dashboard`)
2. Faça upload de todos os arquivos desta pasta
3. Ative o GitHub Pages em:
   - Settings → Pages
   - Branch: `main`
   - Folder: `/root`
4. Acesse: `https://SEU-USUARIO.github.io/cnpi-dashboard/`

## ⚙️ Funcionalidades

- ✅ Cotações em tempo real de PETR4 e VALE3
- ✅ Indicadores macro: Dólar e IBOVESPA
- ✅ Busca de qualquer ticker da B3
- ✅ Auto-atualização a cada 30 segundos
- ✅ Design responsivo (mobile-friendly)
- ✅ Dark mode premium

## 🔌 API Utilizada

**Brapi.dev** — gratuita, sem necessidade de chave
- Documentação: https://brapi.dev/docs
- Rate limit: ~30 requisições/minuto (generoso)

## 📝 Customização

### Adicionar mais ativos

Edite `script.js`:

```javascript
const ATIVOS = [
  { ticker: 'PETR4', name: 'Petrobras PN', sector: 'Petróleo & Gás' },
  { ticker: 'VALE3', name: 'Vale ON', sector: 'Mineração' },
  { ticker: 'ITUB4', name: 'Itaú PN', sector: 'Banco' }, // adicione aqui
];
```

### Alterar intervalo de auto-refresh

```javascript
refreshInterval = setInterval(updateQuotes, 30000); // 30000ms = 30s
```

## 📄 Licença

Projeto CNPI — Flávio Pascoal © 2026
