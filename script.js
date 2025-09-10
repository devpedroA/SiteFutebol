

// ===== CONFIGURAÇÃO E CONSTANTES =====
const CONFIG = {
  MOBILE_BREAKPOINT: 768,
  BANNER_IMAGES: {
    mobile: "https://www.campinagrandedosul.pr.gov.br/Downloads/Imagens/2019/1/2bewgaogc42.jpg",
    desktop: "https://www.campinagrandedosul.pr.gov.br/Downloads/Imagens/2019/1/n3w4ihcygnz.jpg"
  }
};

// ===== UTILITÁRIOS =====
const Utils = {
  firstName: str => str ? str.split(' ')[0] : '',
  parseDateBR: dateString => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  },
  formatDate: dateString => {
    const [day, month, year] = dateString.split('/');
    return year === '2099' ? 'A DEFINIR' : dateString;
  },
  debounce: (func, timeout = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), timeout);
    };
  },
  loadCSS: () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://devpedroa.github.io/mycsscdn/mycsscdn.css";
    document.head.appendChild(link);
  }
};

// ===== ESTADO DA APLICAÇÃO =====
const AppState = {
  currentSerie: 'ouro',
  currentRodada: 9,
  data: null,
  getLastCompletedRodada(serie) {
    if (!this.data || !this.data[serie]?.rodadas) return 1;
    const currentDate = new Date();
    const completedRodadas = this.data[serie].rodadas.filter(rodada => {
      const [day, month, year] = rodada.data.split('/');
      const rodadaDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      return rodadaDate <= currentDate;
    });
    if (completedRodadas.length === 0) return 1;
    return Math.max(...completedRodadas.map(r => r.rodada));
  },
  changeSerie(newSerie) {
    this.currentSerie = newSerie;
    this.currentRodada = this.getLastCompletedRodada(newSerie);
  }
};

// ===== PROCESSAMENTO DE DADOS =====
const DataProcessor = {
  createTeamMap(serie, data) {
    const teamMap = {};
    data[serie].times.forEach(team => {
      teamMap[team.nome] = { ...team };
    });
    return teamMap;
  },
  resetTeamStats(team) {
    Object.assign(team, {
      pontos: 0, vitorias: 0, empates: 0, derrotas: 0,
      golsPro: 0, golsContra: 0, saldo: 0,
      cartoesAmarelos: 0, cartoesVermelhos: 0
    });
  },
  processGame(teamA, teamB, scoreA, scoreB, cardsData = {}) {
    teamA.golsPro += scoreA;
    teamA.golsContra += scoreB;
    teamB.golsPro += scoreB;
    teamB.golsContra += scoreA;
    teamA.cartoesAmarelos += cardsData.cartoesAmarelosA || 0;
    teamA.cartoesVermelhos += cardsData.cartoesVermelhosA || 0;
    teamB.cartoesAmarelos += cardsData.cartoesAmarelosB || 0;
    teamB.cartoesVermelhos += cardsData.cartoesVermelhosB || 0;
    if (scoreA > scoreB) {
      teamA.vitorias++;
      teamA.pontos += 3;
      teamB.derrotas++;
    } else if (scoreA < scoreB) {
      teamB.vitorias++;
      teamB.pontos += 3;
      teamA.derrotas++;
    } else {
      teamA.empates++;
      teamB.empates++;
      teamA.pontos += 1;
      teamB.pontos += 1;
    }
  },
  calculateTable(serie, data, getLastCompletedRodada) {
    const teamMap = this.createTeamMap(serie, data);
    Object.values(teamMap).forEach(team => this.resetTeamStats(team));
    const lastRodada = getLastCompletedRodada(serie);
    const currentDate = new Date();
    const completedRodadas = data[serie].rodadas.filter(rodada => {
      const rodadaDate = Utils.parseDateBR(rodada.data);
      return rodada.rodada <= lastRodada && rodadaDate <= currentDate;
    });
    completedRodadas.forEach(rodada => {
      rodada.jogos.forEach(jogo => {
        if (jogo.placarA != null && jogo.placarB != null) {
          const teamA = teamMap[jogo.timeA];
          const teamB = teamMap[jogo.timeB];
          if (teamA && teamB) {
            const cardsData = {
              cartoesAmarelosA: jogo.cartoesAmarelosA || 0,
              cartoesVermelhosA: jogo.cartoesVermelhosA || 0,
              cartoesAmarelosB: jogo.cartoesAmarelosB || 0,
              cartoesVermelhosB: jogo.cartoesVermelhosB || 0
            };
            this.processGame(teamA, teamB, jogo.placarA, jogo.placarB, cardsData);
          }
        }
      });
    });
    Object.values(teamMap).forEach(team => {
      team.saldo = team.golsPro - team.golsContra;
    });
    return Object.values(teamMap);
  },
  sortTeams(teams) {
    return teams.sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      const cartaoVermelho = 15;
      const cartaoAmarelo = 5;
      const totalA = a.cartoesVermelhos * cartaoVermelho + a.cartoesAmarelos * cartaoAmarelo;
      const totalB = b.cartoesVermelhos * cartaoVermelho + b.cartoesAmarelos * cartaoAmarelo;
      return totalA - totalB;
    });
  }
};

// ===== RESOLUÇÃO DE URL DE DADOS (GitHub Raw + fallbacks) =====
function resolveDataUrls(filename) {
  const owner = 'devpedroA';
  const repo = 'SiteFutebol';
  const urls = [];
  try {
    urls.push(new URL(filename, window.location.href).href);
    urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filename}`);
    urls.push(`https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${filename}`);
    urls.push(`https://${owner}.github.io/${repo}/${filename}`);
  } catch (e) { /* ignore */ }
  return Array.from(new Set(urls));
}

// ===== INTERFACE DO USUÁRIO =====
const UI = {
  // Atualiza imagem do banner baseado no tamanho da tela
  updateBannerImage() {
    const img = document.getElementById("banner-img");
    if (!img) return;
    const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
    img.src = isMobile ? CONFIG.BANNER_IMAGES.mobile : CONFIG.BANNER_IMAGES.desktop;
  },

  updateRodadaLabel() {
    const label = document.getElementById('rodada-atual');
    if (label) {
      label.textContent = `${AppState.currentRodada}ª RODADA`;
    }
  },

  updateSerieButtons() {
    // Ativa/desativa botões conforme a série atual
    const series = Object.keys(AppState.data || {});
    series.forEach(serie => {
      const btn = document.querySelector(`[data-serie='${serie}']`);
      if (btn) {
        if (serie === AppState.currentSerie) {
          btn.classList.add('active', 'btn-success');
        } else {
          btn.classList.remove('active', 'btn-success');
        }
        btn.onclick = (e) => {
          e.preventDefault();
          if (AppState.currentSerie !== serie) {
            AppState.changeSerie(serie);
            App.updateUI();
            UI.updateSerieButtons();
            UI.updateLegenda();
          }
        };
      }
    });
  },

  updateLegenda() {
    const legenda = document.getElementById('legenda-prata');
    if (legenda) {
      if (AppState.currentSerie === 'prata') {
        legenda.style.display = 'flex';
      } else {
        legenda.style.display = 'none';
      }
    }
  },

  showLoading() {
    // Apenas mostra o spinner já presente no HTML
    const tbody = document.getElementById('tabela-body');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="11" class="text-center"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>`;
    }
    const gamesContainer = document.getElementById('jogos-container');
    if (gamesContainer) {
      gamesContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
    }
  },

  updateRodadaLabel() {
    const label = document.getElementById('rodada-atual');
    if (!label || !AppState.data || !AppState.data[AppState.currentSerie]) return;
    const rodadaObj = AppState.data[AppState.currentSerie].rodadas.find(r => r.rodada === AppState.currentRodada);
    let rodadaNome = '';
    if (rodadaObj && rodadaObj.nome) {
      rodadaNome = ` - ${rodadaObj.nome}`;
    }
    label.textContent = `${AppState.currentRodada}ª RODADA${rodadaNome}`;
  },

  hideLoading() {
    // Não faz nada, pois o loading é substituído ao renderizar
  }
};

// ===== RENDERIZAÇÃO =====
const Renderer = {
  renderTable(serie) {
    const tbody = document.getElementById('tabela-body');
    if (!AppState.data || !AppState.data[serie]) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center">Série não encontrada</td></tr>';
      return;
    }
    const teams = DataProcessor.sortTeams(DataProcessor.calculateTable(serie, AppState.data, AppState.getLastCompletedRodada.bind(AppState)));
    tbody.innerHTML = '';
    const template = document.getElementById('team-row-template');
    teams.forEach((team, i) => {
      const row = template.content.firstElementChild.cloneNode(true);

      // Classificação visual específica por série
      if (serie === 'prata') {
        // Série Prata: 8 primeiros (verde para subir) e 6 últimos (vermelho para cair)
        if (i < 8) row.classList.add('table-success'); // 8 primeiros - tarja verde
        if (i >= teams.length - 6) row.classList.add('table-danger'); // 6 últimos - tarja vermelha
      } else {
        // Série Ouro: 4 primeiros e 2 últimos (padrão)
        if (i < 4) row.classList.add('table-success'); // 4 primeiros
        if (i >= teams.length - 2) row.classList.add('table-danger'); // 2 últimos
      }

      row.querySelector('.position').textContent = i + 1;
      row.querySelector('.team-img').src = team.imagem;
      row.querySelector('.team-img').alt = team.nome;
      row.querySelector('.team-nome').textContent = (team.nome);
      row.querySelector('.team-pontos').textContent = team.pontos;
      row.querySelector('.team-vitorias').textContent = team.vitorias;
      row.querySelector('.team-empates').textContent = team.empates;
      row.querySelector('.team-derrotas').textContent = team.derrotas;
      row.querySelector('.team-golsPro').textContent = team.golsPro;
      row.querySelector('.team-golsContra').textContent = team.golsContra;
      row.querySelector('.team-saldo').textContent = team.saldo;
      row.querySelector('.team-cartoesAmarelos').textContent = team.cartoesAmarelos;
      row.querySelector('.team-cartoesVermelhos').textContent = team.cartoesVermelhos;
      tbody.appendChild(row);
    });
    if (typeof $ !== 'undefined') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  },

  renderGames(serie, rodada) {
    const container = document.getElementById('jogos-container');
    if (!AppState.data || !AppState.data[serie]) {
      container.innerHTML = '<p class="text-center text-muted">Série não encontrada.</p>';
      return;
    }
    const rodadaObj = AppState.data[serie].rodadas.find(r => r.rodada === rodada);
    if (!rodadaObj || rodadaObj.jogos.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">Sem jogos para esta rodada.</p>';
      return;
    }
    container.innerHTML = '';
    const teamMap = DataProcessor.createTeamMap(serie, AppState.data);
    // Detect knockout round by nome
    const knockout = rodadaObj.nome && /(Quartas|Semifinal|Final)/i.test(rodadaObj.nome);
    if (knockout) {
      rodadaObj.jogos.forEach((game, idx) => {
        const card = document.createElement('div');
        card.className = 'bracket-game mb-4 p-3';
        card.style.border = '2px solid #43e97b';
        card.style.borderRadius = '1rem';
        card.style.background = '#f8f9fa';
        card.style.maxWidth = '400px';
        card.style.margin = '0 auto';

        // Teams and score
        const teamA = teamMap[game.timeA] || {};
        const teamB = teamMap[game.timeB] || {};
        const placarA = game.placarA;
        const placarB = game.placarB;

        // Winner logic
        let winner = null;
        if (placarA > placarB) winner = 'A';
        else if (placarB > placarA) winner = 'B';
        // Penalty logic (if draw and penalty fields exist)
        let penaltyInfo = '';
        if (placarA === placarB && game.penaltisA !== undefined && game.penaltisB !== undefined) {
          penaltyInfo = `<div class="text-center mt-2"><span style='font-weight:bold;'>Pênaltis:</span> <span class='${game.penaltisA > game.penaltisB ? 'text-success' : ''}'>${game.penaltisA}</span> x <span class='${game.penaltisB > game.penaltisA ? 'text-success' : ''}'>${game.penaltisB}</span></div>`;
          if (game.penaltisA > game.penaltisB) winner = 'A';
          else if (game.penaltisB > game.penaltisA) winner = 'B';
        }

        // Lógica para destacar o vencedor em verde apenas na série ouro
        const highlightA = (serie === 'ouro' && winner === 'A') ? 'color:#1b8f3c;font-weight:bold;' : '';
        const highlightB = (serie === 'ouro' && winner === 'B') ? 'color:#1b8f3c;font-weight:bold;' : '';
        card.innerHTML = `
          <div class="text-center text-muted mb-2" style="font-size:0.95rem;">${Utils.formatDate(rodadaObj.data)} • <strong>${game.hora}</strong> • ${game.estadio}</div>
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img src="${teamA.imagem || ''}" alt="${game.timeA}" style="width:40px;height:40px;object-fit:contain;" class="mr-2">
              <span style="font-size:1.1rem;${highlightA}">${Utils.firstName(game.timeA)}</span>
            </div>
            <div class="score-display mx-2" style="font-size:1.5rem; font-weight:bold;">
              <span>${placarA}</span>
              <span style="font-size:1rem;">x</span>
              <span>${placarB}</span>
            </div>
            <div class="d-flex align-items-center">
              <span style="font-size:1.1rem;${highlightB}">${Utils.firstName(game.timeB)}</span>
              <img src="${teamB.imagem || ''}" alt="${game.timeB}" style="width:40px;height:40px;object-fit:contain;" class="ml-2">
            </div>
          </div>
          ${penaltyInfo}
        `;
        container.appendChild(card);
      });
      // Ajuste visual: remove espaço extra do primeiro card
      const style = document.createElement('style');
      style.textContent = `
        .bracket-game { margin-top: 2rem !important; margin-bottom: 0 !important; }
        @media (min-width: 768px) {
          #jogos-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; }
          .bracket-game { flex: 1 1 350px; min-width: 320px; }
        }
      `;
      document.head.appendChild(style);
    } else {
      const template = document.getElementById('game-row-template');
      for (let i = 0; i < rodadaObj.jogos.length; i += 3) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row justify-content-around w-100 mb-4';
        const gamesSlice = rodadaObj.jogos.slice(i, i + 3);
        gamesSlice.forEach(game => {
          const card = template.content.firstElementChild.cloneNode(true);
          card.querySelector('.game-data').textContent = Utils.formatDate(rodadaObj.data);
          card.querySelector('.game-hora').textContent = game.hora;
          card.querySelectorAll('.game-estadio').forEach(e => e.textContent = game.estadio);
          card.querySelector('.game-imgA').src = teamMap[game.timeA]?.imagem || '';
          card.querySelector('.game-imgA').alt = game.timeA;
          card.querySelector('.game-nomeA').textContent = game.timeA;
          card.querySelector('.game-imgB').src = teamMap[game.timeB]?.imagem || '';
          card.querySelector('.game-imgB').alt = game.timeB;
          card.querySelector('.game-nomeB').textContent = game.timeB;
          card.querySelector('.game-placarA').textContent = game.placarA;
          card.querySelector('.game-placarB').textContent = game.placarB;
          rowDiv.appendChild(card);
        });
        container.appendChild(rowDiv);
      }
    }
  },

  renderSerieButtons() {
    UI.updateSerieButtons();
  },

  renderArtilheiros(serie) {
    const container = document.getElementById('artilheiros-list');
    if (!AppState.data[serie]?.artilheiros) {
      container.innerHTML = '<p class="text-center text-muted">Dados não disponíveis</p>';
      return;
    }

    container.innerHTML = '';
    const template = document.getElementById('artilheiro-template');
    const teamMap = DataProcessor.createTeamMap(serie, AppState.data);

    const sortedArtilheiros = [...AppState.data[serie].artilheiros]
      .sort((a, b) => (b.gols || 0) - (a.gols || 0) || (a.nome || '').localeCompare(b.nome || ''));

    sortedArtilheiros.forEach((artilheiro, index) => {
      const item = template.content.firstElementChild.cloneNode(true);

      item.querySelector('.position-badge').textContent = index + 1;
      item.querySelector('.team-img').src = (teamMap[artilheiro.time]?.imagem) || artilheiro.imagem || '';
      item.querySelector('.team-img').alt = artilheiro.time;
      item.querySelector('.player-name').textContent = artilheiro.nome;
      item.querySelector('.team-name').textContent = artilheiro.time;
      item.querySelector('.goals-badge').textContent = artilheiro.gols;
      if (index < 3) {
        item.classList.add('top-performer', `top-${index + 1}`);
      }

      container.appendChild(item);
    });

    // Após renderizar todos, limitar a altura ao tamanho dos 5 primeiros
    this.applyScrollableLimit(container, '.artilheiro-item');
  },

  renderGoleiros(serie) {
    const container = document.getElementById('goleiros-list');
    if (!AppState.data[serie]?.goleiros) {
      container.innerHTML = '<p class="text-center text-muted">Dados não disponíveis</p>';
      return;
    }

    container.innerHTML = '';
    const template = document.getElementById('goleiro-template');
    const teamMap = DataProcessor.createTeamMap(serie, AppState.data);

    const sortedGoleiros = [...AppState.data[serie].goleiros]
      .map(g => {
        const partidas = typeof g.partidas === 'number' ? g.partidas : parseFloat(g.partidas) || 0;
        const golsSofridos = typeof g.golsSofridos === 'number' ? g.golsSofridos : parseFloat(g.golsSofridos) || 0;
        const media = partidas > 0 ? golsSofridos / partidas : Number.POSITIVE_INFINITY;
        return { ...g, partidas, golsSofridos, media };
      })
      .sort((a, b) => {
        if (a.media !== b.media) return a.media - b.media; // menor média primeiro
        if (a.partidas !== b.partidas) return b.partidas - a.partidas; // mais partidas primeiro
        if (a.golsSofridos !== b.golsSofridos) return a.golsSofridos - b.golsSofridos; // menos gols sofridos
        return (a.nome || '').localeCompare(b.nome || '');
      });

    sortedGoleiros.forEach((goleiro, index) => {
      const item = template.content.firstElementChild.cloneNode(true);

      item.querySelector('.position-badge').textContent = index + 1;
      item.querySelector('.team-img').src = (teamMap[goleiro.time]?.imagem) || goleiro.imagem || '';
      item.querySelector('.team-img').alt = goleiro.time;
      item.querySelector('.player-name').textContent = goleiro.nome;
      item.querySelector('.team-name').textContent = goleiro.time;
      item.querySelector('.goals-badge').textContent = goleiro.golsSofridos;
      if (index < 3) {
        item.classList.add('top-performer', `top-${index + 1}`);
      }

      container.appendChild(item);
    });

    // Após renderizar todos, limitar a altura ao tamanho dos 5 primeiros
    this.applyScrollableLimit(container, '.goleiro-item');
  }
};

// ===== APLICAÇÃO PRINCIPAL =====
const App = {
  // Atualiza toda a interface
  updateUI() {
    UI.showLoading();
    try {
      Renderer.renderTable(AppState.currentSerie);
      Renderer.renderGames(AppState.currentSerie, AppState.currentRodada);
      Renderer.renderArtilheiros(AppState.currentSerie);
      Renderer.renderGoleiros(AppState.currentSerie);
      UI.updateRodadaLabel();
      UI.updateLegenda();
    } catch (error) {
      console.error('Erro ao atualizar UI:', error);
    } finally {
      UI.hideLoading();
    }
  },

  setupRodadaNavigation() {
    document.getElementById('prev-rodada').onclick = () => {
      if (AppState.currentRodada > 1) {
        AppState.currentRodada--;
        this.updateUI();
      }
    };
    document.getElementById('next-rodada').onclick = () => {
      // Busca o maior número de rodada presente no array
      const rodadas = AppState.data[AppState.currentSerie]?.rodadas || [];
      const maxRodada = rodadas.length > 0 ? Math.max(...rodadas.map(r => r.rodada)) : 1;
      if (AppState.currentRodada < maxRodada) {
        AppState.currentRodada++;
        this.updateUI();
      }
    };
    // Linha do select removida
  },

  async initialize() {
    Utils.loadCSS();
    window.addEventListener("resize", Utils.debounce(UI.updateBannerImage));
    // Recalcula os limites de rolagem nas listas ao redimensionar
    window.addEventListener("resize", Utils.debounce(() => {
      const artilheiros = document.getElementById('artilheiros-list');
      const goleiros = document.getElementById('goleiros-list');
      if (artilheiros) Renderer.applyScrollableLimit(artilheiros, '.artilheiro-item');
      if (goleiros) Renderer.applyScrollableLimit(goleiros, '.goleiro-item');
    }, 150));
    try {
      UI.showLoading();

      // Carregamento com fallback: GitHub Raw → jsDelivr → GitHub Pages → relativo
      const fetchJSONWithFallback = async (filename) => {
        const urls = Renderer.resolveDataUrls(filename);
        let lastError;
        for (const url of urls) {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) return res.json();
            lastError = new Error(`HTTP ${res.status}`);
          } catch (e) {
            lastError = e;
          }
        }
        throw new Error(`Erro ao carregar ${filename}: ${lastError?.message || 'desconhecido'}`);
      };

      const [timesData, rodadasData, artilhariaData, goleirosData] = await Promise.all([
        fetchJSONWithFallback('times.json'),
        fetchJSONWithFallback('rodadas.json'),
        fetchJSONWithFallback('atilharia.json'),
        fetchJSONWithFallback('goleiros.json')
      ]);

      // Combina os dados em uma estrutura unificada
      AppState.data = {};

      // Para cada série (ouro e prata)
      const series = Object.keys(timesData);
      series.forEach(serie => {
        AppState.data[serie] = {
          times: timesData[serie]?.times || [],
          rodadas: rodadasData[serie]?.rodadas || [],
          artilheiros: artilhariaData[serie]?.artilheiros || [],
          goleiros: goleirosData[serie]?.goleiros || []
        };
      });

      // SEMPRE inicia na menor rodada disponível (1) ou na última rodada do array
      const rodadas = AppState.data[AppState.currentSerie]?.rodadas || [];
      const maxRodada = rodadas.length > 0 ? Math.max(...rodadas.map(r => r.rodada)) : 1;
      AppState.currentRodada = maxRodada;
      this.setupRodadaNavigation();
      UI.updateBannerImage();
      Renderer.renderSerieButtons();
      UI.updateLegenda();
      this.updateUI();
    } catch (error) {
      console.error('Erro na inicialização:', error);
      const errorContainer = document.getElementById('tabela-body') || document.body;
      errorContainer.innerHTML = `
        <tr><td colspan="11" class="text-center">
          <div class="alert alert-danger">
            Erro ao carregar dados: ${error.message}
          </div>
        </td></tr>
      `;
    } finally {
      UI.hideLoading();
    }
  }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
  Utils.loadCSS();
  App.initialize();
});

// ===== UTILITÁRIO DE SCROLL PARA LISTAS =====
Renderer.applyScrollableLimit = function (listContainer, itemSelector) {
  try {
    if (!listContainer) return;
    const items = listContainer.querySelectorAll(itemSelector);
    if (!items || items.length <= 5) {
      listContainer.style.maxHeight = '';
      listContainer.style.overflowY = '';
      return;
    }
    let height = 0;
    for (let i = 0; i < Math.min(5, items.length); i++) {
      const el = items[i];
      const style = window.getComputedStyle(el);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      height += el.offsetHeight + marginTop + marginBottom;
    }
    listContainer.style.maxHeight = height + 'px';
    listContainer.style.overflowY = 'auto';
  } catch (e) {
    console.warn('Falha ao aplicar limite rolável:', e);
  }
};

// ===== RESOLUÇÃO DE URL DE DADOS (GitHub Raw + fallbacks) =====
Renderer.resolveDataUrls = function (filename) {
  const owner = 'devpedroA';
  const repo = 'SiteFutebol';
  const urls = [];
  try {
    urls.push(new URL(filename, window.location.href).href);
    urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filename}`);
    urls.push(`https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${filename}`);
    urls.push(`https://${owner}.github.io/${repo}/${filename}`);
  } catch (e) { /* ignore */ }
  return Array.from(new Set(urls));
};