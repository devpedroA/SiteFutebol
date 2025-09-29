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
    if (!dateString || typeof dateString !== 'string') return new Date();

    // Se for formato ISO (2025-06-01T03:00:00.000Z), usar diretamente
    if (dateString.includes('T') && dateString.includes('Z')) {
      try {
        return new Date(dateString);
      } catch (error) {
        console.warn('Erro ao processar data ISO:', dateString, error);
        return new Date();
      }
    }

    // Se for formato brasileiro (DD/MM/YYYY)
    const dateParts = dateString.split('/');
    if (dateParts.length !== 3) return new Date();
    const [day, month, year] = dateParts;
    if (!day || !month || !year) return new Date();
    try {
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } catch (error) {
      console.warn('Erro ao processar data:', dateString, error);
      return new Date();
    }
  },
  formatDate: dateString => {
    if (!dateString || typeof dateString !== 'string') return 'A DEFINIR';

    try {
      let date;

      // Se for formato ISO (2025-06-01T03:00:00.000Z), converter para Date
      if (dateString.includes('T') && dateString.includes('Z')) {
        date = new Date(dateString);
      } else {
        // Se for formato brasileiro (DD/MM/YYYY)
        const dateParts = dateString.split('/');
        if (dateParts.length !== 3) return 'A DEFINIR';
        const [day, month, year] = dateParts;
        if (!year) return 'A DEFINIR';
        if (year === '2099') return 'A DEFINIR';
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }

      // Verificar se a data é válida
      if (isNaN(date.getTime())) return 'A DEFINIR';

      // Formatar para português brasileiro
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      // Nomes dos meses em português
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      const monthName = monthNames[date.getMonth()];

      // Retornar formato bonito: "01 de Junho de 2025"
      return `${day} de ${monthName} de ${year}`;

    } catch (error) {
      console.warn('Erro ao formatar data:', dateString, error);
      return 'A DEFINIR';
    }
  },
  formatTime: timeString => {
    if (!timeString || typeof timeString !== 'string') return 'A DEFINIR';

    try {
      // Se for formato ISO (2025-06-01T11:30:00.000Z), extrair apenas a hora
      if (timeString.includes('T') && timeString.includes('Z')) {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }

      // Se já estiver no formato HH:MM, retornar como está
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }

      return timeString;
    } catch (error) {
      console.warn('Erro ao formatar hora:', timeString, error);
      return 'A DEFINIR';
    }
  },
  formatGameInfo: (data, hora, estadio) => {
    // Formatar data para dd/mm/yyyy
    let dataFormatada = 'A DEFINIR';
    try {
      let date;
      if (data.includes('T') && data.includes('Z')) {
        date = new Date(data);
      } else {
        const dateParts = data.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }

      if (date && !isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        dataFormatada = `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.warn('Erro ao formatar data:', data, error);
    }

    const horaFormatada = Utils.formatTime(hora);

    return `
      <div class="game-info">
        <div class="text-center text-muted" style="font-size:0.9rem;">
          ${dataFormatada} • ${estadio} • ${horaFormatada}
        </div>
      </div>
    `;
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
    if (!this.data || !this.data[serie]?.rodadas) {
      return 1;
    }

    const currentDate = new Date();

    // Para fins de demonstração, vamos considerar que todas as rodadas de 2025 são completadas
    const completedRodadas = this.data[serie].rodadas.filter(rodada => {
      if (!rodada.data || typeof rodada.data !== 'string') return false;

      try {
        const rodadaDate = new Date(rodada.data);

        // Se for 2025, considerar todas as rodadas como completadas para demonstração
        if (rodadaDate.getFullYear() === 2025) {
          return true;
        }

        return rodadaDate <= currentDate;
      } catch (error) {
        console.warn('Erro ao processar data da rodada:', rodada.data, error);
        return false;
      }
    });

    if (completedRodadas.length === 0) return 1;
    const maxRodada = Math.max(...completedRodadas.map(r => r.rodada));
    return maxRodada;
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
    if (!data || !data[serie] || !data[serie].times) {
      console.warn(`Dados de times não encontrados para série: ${serie}`);
      return teamMap;
    }

    data[serie].times.forEach(team => {
      if (team && team.nome) {
        teamMap[team.nome] = { ...team };
      }
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

    if (!data || !data[serie] || !data[serie].rodadas) {
      console.warn(`Dados de rodadas não encontrados para série: ${serie}`);
      return Object.values(teamMap);
    }

    const completedRodadas = data[serie].rodadas.filter(rodada => {
      if (!rodada || !rodada.data) return false;

      try {
        const rodadaDate = new Date(rodada.data);

        // Se for 2025, considerar todas as rodadas como completadas para demonstração
        if (rodadaDate.getFullYear() === 2025) {
          return rodada.rodada <= lastRodada;
        }

        return rodada.rodada <= lastRodada && rodadaDate <= currentDate;
      } catch (error) {
        console.warn('Erro ao processar data da rodada:', rodada.data, error);
        return false;
      }
    });

    completedRodadas.forEach(rodada => {
      if (!rodada.jogos) return;
      rodada.jogos.forEach(jogo => {
        if (jogo && jogo.placarA != null && jogo.placarB != null) {
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

// ===== FUNÇÃO REMOVIDA: resolveDataUrls não é mais necessária =====
// Agora usamos apenas dados do banco PostgreSQL

// ===== INTERFACE DO USUÁRIO =====
const UI = {
  // Atualiza imagem do banner baseado no tamanho da tela
  updateBannerImage() {
    const img = document.getElementById("banner-img");
    if (!img) return;
    const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
    img.src = isMobile ? CONFIG.BANNER_IMAGES.mobile : CONFIG.BANNER_IMAGES.desktop;
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
    const rodadasComNumero = (AppState.data[AppState.currentSerie]?.rodadas || []).filter(r => r && r.rodada === AppState.currentRodada);
    let rodadaNome = '';
    let rodadaData = '';

    if (rodadasComNumero.length > 0) {
      if (rodadasComNumero.length === 1) {
        rodadaNome = rodadasComNumero[0].nome || `Rodada ${AppState.currentRodada}`;
        rodadaData = Utils.formatDate(rodadasComNumero[0].data);
      } else {
        rodadaNome = `Rodada ${AppState.currentRodada}`;
        rodadaData = 'Múltiplas datas';
      }
    } else {
      rodadaNome = `Rodada ${AppState.currentRodada}`;
      rodadaData = 'Data não definida';
    }

    // Criar HTML mais bonito com ícones
    label.innerHTML = `
      <div class="d-flex align-items-center justify-content-center">
        <i class="fas fa-calendar-week mr-2"></i>
        <div class="text-center">
          <div class="fw-bold">${rodadaNome}</div>
          <small class="opacity-75">${rodadaData}</small>
        </div>
      </div>
    `;
  },

  hideLoading() {
    // Remove o spinner da tabela
    const tbody = document.getElementById('tabela-body');
    if (tbody && tbody.innerHTML.includes('loading-spinner')) {
      tbody.innerHTML = '';
    }
    // Remove o spinner dos jogos
    const gamesContainer = document.getElementById('jogos-container');
    if (gamesContainer && gamesContainer.innerHTML.includes('loading-spinner')) {
      gamesContainer.innerHTML = '';
    }
  }
};

// ===== RENDERIZAÇÃO =====
const Renderer = {
  renderTable(serie) {
    const tbody = document.getElementById('tabela-body');
    console.log('Renderizando tabela para série:', serie);
    console.log('AppState.data:', AppState.data);
    console.log('Série disponível:', AppState.data?.[serie]);
    
    if (!AppState.data || !AppState.data[serie]) {
      console.warn(`Série '${serie}' não encontrada. Séries disponíveis:`, Object.keys(AppState.data || {}));
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
    console.log('Renderizando jogos para série:', serie, 'rodada:', rodada);
    console.log('AppState.data:', AppState.data);
    console.log('Série disponível:', AppState.data?.[serie]);
    
    if (!AppState.data || !AppState.data[serie]) {
      console.warn(`Série '${serie}' não encontrada. Séries disponíveis:`, Object.keys(AppState.data || {}));
      container.innerHTML = '<p class="text-center text-muted">Série não encontrada.</p>';
      return;
    }
    const rodadasComNumero = (AppState.data[serie]?.rodadas || []).filter(r => r && r.rodada === rodada);
    if (rodadasComNumero.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">Sem jogos para esta rodada.</p>';
      return;
    }
    container.innerHTML = '';
    const teamMap = DataProcessor.createTeamMap(serie, AppState.data);

    // Processar todas as rodadas com o mesmo número
    rodadasComNumero.forEach((rodadaObj, rodadaIndex) => {
      if (rodadaObj.jogos.length === 0) return;

      // Adicionar título da rodada se houver múltiplas rodadas com mesmo número
      if (rodadasComNumero.length > 1 && rodadaObj.nome) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'text-center mb-3';
        titleDiv.innerHTML = `<h5 class="text-primary font-weight-bold">${rodadaObj.nome}</h5>`;
        container.appendChild(titleDiv);
      }

      // Detect knockout round by nome
      const knockout = rodadaObj.nome && /(Quartas|Semi Finais|Final)/i.test(rodadaObj.nome);
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
          // Para funcionar, os dados da API devem incluir: penaltisA e penaltisB
          // Exemplo: { "timeA": "Time A", "timeB": "Time B", "placarA": 1, "placarB": 1, "penaltisA": 4, "penaltisB": 3 }
          let penaltyInfo = '';
          let penaltyWinnerA = '';
          let penaltyWinnerB = '';

          if (placarA === placarB && game.penaltisA !== undefined && game.penaltisB !== undefined) {
            penaltyInfo = `<div class="text-center mt-2"><span style='font-weight:bold;'>Pênaltis:</span> <span class='${game.penaltisA > game.penaltisB ? 'text-success' : ''}'>${game.penaltisA}</span> x <span class='${game.penaltisB > game.penaltisA ? 'text-success' : ''}'>${game.penaltisB}</span></div>`;

            if (game.penaltisA > game.penaltisB) {
              winner = 'A';
              penaltyWinnerA = ` <span class="penalty-result">(${game.penaltisA})</span>`;
              penaltyWinnerB = ` <span class="penalty-result">(${game.penaltisB})</span> `;
            } else if (game.penaltisB > game.penaltisA) {
              winner = 'B';
              penaltyWinnerA = ` <span class="penalty-result">(${game.penaltisA})</span>`;
              penaltyWinnerB = ` <span class="penalty-result">(${game.penaltisB})</span> `;
            }
          }

          // Lógica para destacar o vencedor em verde apenas na série ouro
          const highlightA = (serie === 'ouro' && winner === 'A') ? 'color:#1b8f3c;font-weight:bold;' : '';
          const highlightB = (serie === 'ouro' && winner === 'B') ? 'color:#1b8f3c;font-weight:bold;' : '';
          card.innerHTML = `
            ${Utils.formatGameInfo(rodadaObj.data, game.hora, game.estadio)}
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <img src="${teamA.imagem || ''}" alt="${game.timeA}" style="width:40px;height:40px;object-fit:contain;" class="mr-2">
                <span style="font-size:1.1rem;${highlightA}">${Utils.firstName(game.timeA)}${penaltyWinnerA}</span>
              </div>
              <div class="score-display mx-2" style="font-size:1.5rem; font-weight:bold;">
                <span>${placarA}</span>
                <span style="font-size:1rem;">x</span>
                <span>${placarB}</span>
              </div>
              <div class="d-flex align-items-center">
                <span style="font-size:1.1rem;${highlightB}">${penaltyWinnerB}${Utils.firstName(game.timeB)}</span>
                <img src="${teamB.imagem || ''}" alt="${game.timeB}" style="width:40px;height:40px;object-fit:contain;" class="ml-2">
              </div>
            </div>
            ${penaltyInfo}
          `;
          container.appendChild(card);
        });
      } else {
        const template = document.getElementById('game-row-template');
        for (let i = 0; i < rodadaObj.jogos.length; i += 3) {
          const rowDiv = document.createElement('div');
          rowDiv.className = 'row justify-content-around w-100 mb-4';
          const gamesSlice = rodadaObj.jogos.slice(i, i + 3);
          gamesSlice.forEach(game => {
            const card = template.content.firstElementChild.cloneNode(true);

            // Lógica de pênaltis
            let penaltyWinnerA = '';
            let penaltyWinnerB = '';

            if (game.placarA === game.placarB && game.penaltisA !== undefined && game.penaltisB !== undefined) {
              if (game.penaltisA > game.penaltisB) {
                penaltyWinnerA = ` <span class="penalty-result">(${game.penaltisA})</span>`;
                penaltyWinnerB = ` <span class="penalty-result">(${game.penaltisB})</span> `;
              } else if (game.penaltisB > game.penaltisA) {
                penaltyWinnerA = ` <span class="penalty-result">(${game.penaltisA})</span>`;
                penaltyWinnerB = ` <span class="penalty-result">(${game.penaltisB})</span> `;
              }
            }

            // Substituir o conteúdo da div game-info pela nova formatação
            const gameInfoDiv = card.querySelector('.game-info');
            if (gameInfoDiv) {
              gameInfoDiv.innerHTML = Utils.formatGameInfo(rodadaObj.data, game.hora, game.estadio).replace(/<div class="game-info">|<\/div>/g, '');
            }
            card.querySelector('.game-imgA').src = teamMap[game.timeA]?.imagem || '';
            card.querySelector('.game-imgA').alt = game.timeA;
            card.querySelector('.game-nomeA').innerHTML = game.timeA + penaltyWinnerA;
            card.querySelector('.game-imgB').src = teamMap[game.timeB]?.imagem || '';
            card.querySelector('.game-imgB').alt = game.timeB;
            card.querySelector('.game-nomeB').innerHTML = penaltyWinnerB + game.timeB;
            card.querySelector('.game-placarA').textContent = game.placarA;
            card.querySelector('.game-placarB').textContent = game.placarB;
            rowDiv.appendChild(card);
          });
          container.appendChild(rowDiv);
        }
      }
    });

    // Ajuste visual para knockout games
    if (rodadasComNumero.some(r => r.nome && /(Quartas|Semifinal|Final)/i.test(r.nome))) {
      const style = document.createElement('style');
      style.textContent = `
        .bracket-game { margin-top: 2rem !important; margin-bottom: 0 !important; }
        @media (min-width: 768px) {
          #jogos-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; }
          .bracket-game { flex: 1 1 350px; min-width: 320px; }
        }
      `;
      document.head.appendChild(style);
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

    const artilheiros = AppState.data[serie]?.artilheiros || [];
    const sortedArtilheiros = [...artilheiros]
      .filter(a => a && a.nome)
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
    applyScrollableLimit(container, '.artilheiro-item');
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

    const goleiros = AppState.data[serie]?.goleiros || [];
    const sortedGoleiros = [...goleiros]
      .map(g => {
        if (!g) return null;
        const partidas = typeof g.partidas === 'number' ? g.partidas : parseFloat(g.partidas) || 0;
        const golsSofridos = typeof g.golsSofridos === 'number' ? g.golsSofridos : parseFloat(g.golsSofridos) || 0;
        const media = partidas > 0 ? golsSofridos / partidas : Number.POSITIVE_INFINITY;
        return { ...g, partidas, golsSofridos, media };
      })
      .filter(g => g !== null)
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
    applyScrollableLimit(container, '.goleiro-item');
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
      if (artilheiros) applyScrollableLimit(artilheiros, '.artilheiro-item');
      if (goleiros) applyScrollableLimit(goleiros, '.goleiro-item');
    }, 150));

    try {
      UI.showLoading();

      // Carregar dados da API pública
      console.log('Carregando dados da API...');

      try {
        const response = await fetch('https://absolvable-tifany-overimpressibly.ngrok-free.dev/api/all', {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('API retornou HTML em vez de JSON. Pode ser a página de aviso do ngrok.');
        }

        AppState.data = await response.json();
        console.log('Dados carregados com sucesso da API:', AppState.data);

      } catch (apiError) {
        console.warn('Erro ao carregar da API, tentando arquivos JSON locais:', apiError.message);

        // Fallback para arquivos JSON locais
        const [timesData, rodadasData, artilhariaData, goleirosData] = await Promise.all([
          fetch('times.json').then(res => res.ok ? res.json() : {}),
          fetch('rodadas.json').then(res => res.ok ? res.json() : {}),
          fetch('atilharia.json').then(res => res.ok ? res.json() : {}),
          fetch('goleiros.json').then(res => res.ok ? res.json() : {})
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

        console.log('Dados carregados dos arquivos JSON (fallback)');
        console.log('💡 Dica: Acesse https://absolvable-tifany-overimpressibly.ngrok-free.dev/api/all no navegador para aceitar o aviso do ngrok');
      }

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
            <br><small>Verifique se os arquivos JSON estão disponíveis ou se a API está funcionando</small>
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
function applyScrollableLimit(listContainer, itemSelector) {
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
}