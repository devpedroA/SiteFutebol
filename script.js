// ===== CONFIGURAÇÃO E CONSTANTES =====
const CONFIG = {
  MOBILE_BREAKPOINT: 768,
  BANNER_IMAGES: {
    mobile: "https://www.campinagrandedosul.pr.gov.br/Downloads/Imagens/2019/1/2bewgaogc42.jpg",
    desktop: "https://www.campinagrandedosul.pr.gov.br/Downloads/Imagens/2019/1/n3w4ihcygnz.jpg"
  }
};

// ===== CARREGAMENTO DE CSS =====
function loadCSS() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://devpedroa.github.io/mycsscdn/mycsscdn.css";
  document.head.appendChild(link);
}

// Utilitarios
const Utils = {
  // Converte data brasileira (DD/MM/AAAA) para objeto Date
  parseDateBR(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  },

  // Formata data para exibição (substitui 2099 por "A DEFINIR")
  formatDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return year === '2099' ? 'A DEFINIR' : dateString;
  },

  // Debounce para otimizar eventos
  debounce(func, timeout = 100) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), timeout);
    };
  }
};

// ===== ESTADO DA APLICAÇÃO =====
const AppState = {
  currentSerie: 'ouro',
  currentRodada: 1,
  data: null, 

  
  getLastCompletedRodada(serie) {
    if (!this.data || !this.data[serie]?.rodadas) return 1;

    const currentDate = new Date();
    const completedRodadas = this.data[serie].rodadas.filter(rodada => {
      const rodadaDate = Utils.parseDateBR(rodada.data);
      return rodadaDate <= currentDate;
    });

    if (completedRodadas.length === 0) return 1;
    return Math.max(...completedRodadas.map(r => r.rodada));
  },

  // Muda para uma nova série
  changeSerie(newSerie) {
    this.currentSerie = newSerie;
    this.currentRodada = this.getLastCompletedRodada(newSerie);
  }
};

// ===== PROCESSAMENTO DE DADOS =====
const DataProcessor = {
  // Cria um mapa de times para facilitar acesso
  createTeamMap(serie) {
    const teamMap = {};
    AppState.data[serie].times.forEach(team => {
      teamMap[team.nome] = { ...team };
    });
    return teamMap;
  },

  // Reseta estatísticas de um time
  resetTeamStats(team) {
    Object.assign(team, {
      pontos: 0, vitorias: 0, empates: 0, derrotas: 0,
      golsPro: 0, golsContra: 0, saldo: 0,
      cartoesAmarelos: 0, cartoesVermelhos: 0
    });
  },

  // Processa resultado de um jogo
  processGame(teamA, teamB, scoreA, scoreB, cardsData = {}) {
    // Atualiza gols
    teamA.golsPro += scoreA;
    teamA.golsContra += scoreB;
    teamB.golsPro += scoreB;
    teamB.golsContra += scoreA;

    // Atualiza cartões
    teamA.cartoesAmarelos += cardsData.cartoesAmarelosA || 0;
    teamA.cartoesVermelhos += cardsData.cartoesVermelhosA || 0;
    teamB.cartoesAmarelos += cardsData.cartoesAmarelosB || 0;
    teamB.cartoesVermelhos += cardsData.cartoesVermelhosB || 0;

    // Atualiza resultado
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

  // Calcula tabela de classificação
  calculateTable(serie) {
    const teamMap = this.createTeamMap(serie);

    // Reseta estatísticas
    Object.values(teamMap).forEach(team => this.resetTeamStats(team));

    // Processa rodadas concluídas
    const lastRodada = AppState.getLastCompletedRodada(serie);
    const currentDate = new Date();

    const completedRodadas = AppState.data[serie].rodadas.filter(rodada => {
      const rodadaDate = Utils.parseDateBR(rodada.data);
      return rodada.rodada <= lastRodada && rodadaDate <= currentDate;
    });

    // Processa todos os jogos
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

    // Calcula saldo de gols
    Object.values(teamMap).forEach(team => {
      team.saldo = team.golsPro - team.golsContra;
    });

    return Object.values(teamMap);
  },

  // Ordena times por classificação
  sortTeams(teams) {
    return teams.sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      return b.golsPro - a.golsPro;
    });
  }
};

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
          }
        };
      }
    });
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
    const teams = DataProcessor.sortTeams(DataProcessor.calculateTable(serie));
    tbody.innerHTML = '';
    const template = document.getElementById('team-row-template');
    teams.forEach((team, i) => {
      const row = template.content.firstElementChild.cloneNode(true);
      // Classificação visual
      if (i < 4) row.classList.add('table-success'); // 4 primeiros
      if (i >= teams.length - 2) row.classList.add('table-danger'); // 2 últimos
      // Remover a linha abaixo para não adicionar 'relegation-row' (texto vermelho extra)
      // if (i >= teams.length - 1) row.classList.add('relegation-row');
      row.querySelector('.position').textContent = i + 1;
      row.querySelector('.team-img').src = team.imagem;
      row.querySelector('.team-img').alt = team.nome;
      row.querySelector('.team-nome').textContent = team.nome;
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
    const teamMap = DataProcessor.createTeamMap(serie);
    const template = document.getElementById('game-card-template');
    // Agrupar de 3 em 3
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
  },

  renderSerieButtons() {
    UI.updateSerieButtons();
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
      UI.updateRodadaLabel();
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
      const maxRodada = AppState.data[AppState.currentSerie]?.rodadas.length || 1;
      if (AppState.currentRodada < maxRodada) {
        AppState.currentRodada++;
        this.updateUI();
      }
    };
    // Linha do select removida
  },

  async initialize() {
    loadCSS();
    window.addEventListener("resize", Utils.debounce(UI.updateBannerImage));
    try {
      UI.showLoading();
      const response = await fetch('https://raw.githubusercontent.com/devpedroA/mycsscdn/main/db.json');
      if (!response.ok) throw new Error('Erro ao carregar dados');
      AppState.data = await response.json();
      AppState.currentRodada = AppState.getLastCompletedRodada(AppState.currentSerie);
      this.setupRodadaNavigation();
      UI.updateBannerImage();
      Renderer.renderSerieButtons();
      this.updateUI();
    } catch (error) {
      console.error('Erro na inicialização:', error);
      const errorContainer = document.getElementById('tabela-container') || document.body;
      errorContainer.innerHTML = `
        <div class="alert alert-danger">
          Erro ao carregar dados: ${error.message}
        </div>
      `;
    } finally {
      UI.hideLoading();
    }
  }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
  App.initialize();
});