// URL da sua API (este é um exemplo, precisaria do URL real)
const apiUrl = 'https://api-invest-307231904601.southamerica-east1.run.app/magic_formula';

// Elementos do DOM
const tableBody = document.getElementById('investment-data-body');
const sortSelect = document.getElementById('sort-select');
let investmentData = []; // Inicializa como um array vazio

// Função para buscar e processar os dados da API
async function fetchDataAndInitialize() {
    try {
        const response = await fetch(apiUrl); // Faz o pedido à API
        if (!response.ok) {
            throw new Error(`Erro HTTP! Status: ${response.status}`);
        }
        const apiJsonData = await response.json(); // Converte a resposta para JSON
        console.log(apiJsonData);
        // Assumindo que a API retorna um objeto com uma propriedade "message"
        // como no seu jsonData original
        if (apiJsonData && apiJsonData.message) {
            investmentData = apiJsonData.message;
        } else {
            // Se a estrutura for diferente, ajuste aqui
            investmentData = apiJsonData;
        }

        // Depois de obter os dados, inicializa a tabela e as estatísticas
        sortData('magic_formula');
        updateStats();

    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        // Poderia mostrar uma mensagem de erro para o utilizador na página aqui
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-red-500">Falha ao carregar os dados. Tente novamente mais tarde.</td></tr>`;
        }
    }
}

// Funções formatNumber, getRankColorClass, renderTable, sortData, updateStats
// (O restante das suas funções JavaScript permaneceria aqui, mas usariam a
// variável global `investmentData` que foi preenchida pela API)

// ... (resto das suas funções como formatNumber, getRankColorClass, renderTable, etc.) ...
// Certifique-se que estas funções agora usam a variável `investmentData` que será
// preenchida pela chamada à API.

// Função para formatar números para o padrão brasileiro (ex: 1234.56 -> 1.234,56)
function formatNumber(num, decimalPlaces = 2) {
    // ... (código da função como antes)
    return num.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
}

// Função para determinar a classe CSS de cor com base no valor do rank
function getRankColorClass(rank) {
    // ... (código da função como antes)
    if (rank <= 10) return 'rank-good';
    if (rank <= 30) return 'rank-medium';
    return 'rank-bad';
}

// Função para renderizar (desenhar) as linhas da tabela com os dados fornecidos
function renderTable(data) {
    if (!tableBody) return; // Verifica se tableBody existe
    tableBody.innerHTML = '';
    // ... (resto do código da função como antes, usando o parâmetro 'data')
     data.forEach(item => {
        const row = tableBody.insertRow();
        row.className = 'text-sm text-gray-300';

        const papelCell = row.insertCell();
        papelCell.className = 'px-4 py-3 whitespace-nowrap font-medium text-gray-100';
        papelCell.textContent = item.papel;
        papelCell.title = `Setor: ${item.setor}`;

        row.insertCell().textContent = item.setor;
        row.insertCell().textContent = formatNumber(item.preco);
        row.insertCell().textContent = item.data;

        const evEbitCell = row.insertCell();
        evEbitCell.textContent = formatNumber(item.ev_ebit);
        evEbitCell.className = getRankColorClass(item.rank_ev_ebit);

        const roicCell = row.insertCell();
        roicCell.textContent = formatNumber(item.roic);
        roicCell.className = getRankColorClass(item.rank_roic);

        const rankRoicCell = row.insertCell();
        rankRoicCell.textContent = item.rank_roic;
        rankRoicCell.className = getRankColorClass(item.rank_roic);

        const rankEvEbitCell = row.insertCell();
        rankEvEbitCell.textContent = item.rank_ev_ebit;
        rankEvEbitCell.className = getRankColorClass(item.rank_ev_ebit);

        const scoreCell = row.insertCell();
        scoreCell.textContent = item.score;
        scoreCell.className = getRankColorClass(item.score);

        const magicFormulaCell = row.insertCell();
        magicFormulaCell.textContent = item.magic_formula;
        magicFormulaCell.className = 'font-semibold ' + getRankColorClass(item.magic_formula);

        Array.from(row.cells).forEach(cell => {
            if (!cell.classList.contains('px-4')) {
                 cell.classList.add('px-4', 'py-3', 'whitespace-nowrap');
            }
        });
    });
}

// Função para ordenar os dados com base no critério selecionado no <select>
function sortData(criteria) {
    const sortedData = [...investmentData].sort((a, b) => {
        // ... (lógica de ordenação como antes)
        switch (criteria) {
            case 'roic': return b.roic - a.roic;
            case 'ev_ebit': return a.ev_ebit - b.ev_ebit;
            case 'preco': return b.preco - a.preco;
            case 'score': return a.score - b.score;
            case 'papel': return a.papel.localeCompare(b.papel);
            case 'magic_formula':
            default: return a.magic_formula - b.magic_formula;
        }
    });
    renderTable(sortedData);
}

// Função para atualizar os cards de estatísticas no topo da página
function updateStats() {
    // ... (código da função como antes, usando a variável global investmentData)
    const totalAcoesEl = document.getElementById('total-acoes');
    if (totalAcoesEl) totalAcoesEl.textContent = investmentData.length;

    const melhorRoicEl = document.getElementById('melhor-roic');
    const melhorRoicPapelEl = document.getElementById('melhor-roic-papel');
    if (investmentData.length > 0 && melhorRoicEl && melhorRoicPapelEl) {
        const bestRoic = investmentData.reduce((max, item) => item.roic > max.roic ? item : max, investmentData[0]);
        melhorRoicEl.textContent = formatNumber(bestRoic.roic) + '%';
        melhorRoicPapelEl.textContent = bestRoic.papel;
    } else if (melhorRoicEl) {
        melhorRoicEl.textContent = '0%';
    }

    const menorEvEbitEl = document.getElementById('menor-ev-ebit');
    const menorEvEbitPapelEl = document.getElementById('menor-ev-ebit-papel');
    if (investmentData.length > 0 && menorEvEbitEl && menorEvEbitPapelEl) {
        const lowestEvEbit = investmentData.reduce((min, item) => item.ev_ebit < min.ev_ebit ? item : min, investmentData[0]);
        menorEvEbitEl.textContent = formatNumber(lowestEvEbit.ev_ebit);
        menorEvEbitPapelEl.textContent = lowestEvEbit.papel;
    } else if (menorEvEbitEl) {
        menorEvEbitEl.textContent = '0';
    }

    const topMagicFormulaEl = document.getElementById('top-magic-formula');
    const topMagicFormulaPapelEl = document.getElementById('top-magic-formula-papel');
    if (investmentData.length > 0 && topMagicFormulaEl && topMagicFormulaPapelEl) {
        const topMagic = investmentData.reduce((min, item) => item.magic_formula < min.magic_formula ? item : min, investmentData[0]);
        topMagicFormulaEl.textContent = '#' + topMagic.magic_formula;
        topMagicFormulaPapelEl.textContent = topMagic.papel;
    } else if (topMagicFormulaEl) {
        topMagicFormulaEl.textContent = 'N/A';
    }
}


// Adiciona o listener de evento para o seletor de ordenação
if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
        sortData(event.target.value);
    });
}

// Define o ano atual no rodapé da página
const currentYearEl = document.getElementById('current-year');
if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
}

// Chama a função para buscar os dados quando a página carregar
fetchDataAndInitialize();