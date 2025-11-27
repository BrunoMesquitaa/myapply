// Configuração das URLs das APIs
const apiUrls = {
    'A': 'https://api-invest-307231904601.southamerica-east1.run.app/magic_formula_model_a',
    'B': 'https://api-invest-307231904601.southamerica-east1.run.app/magic_formula_model_b'
};

// Estado atual
let currentModel = 'B'; // Começa com o modelo B

// Elementos do DOM
const tableBody = document.getElementById('investment-data-body');
const sortSelect = document.getElementById('sort-select');
const btnModelA = document.getElementById('btn-model-a');
const btnModelB = document.getElementById('btn-model-b');
const currentYearEl = document.getElementById('current-year');

// Variável global para armazenar os dados
let investmentData = []; 

// Função para trocar de modelo ao clicar no botão
function switchModel(model) {
    if (currentModel === model) return;
    currentModel = model;
    
    // Atualiza botões
    if (model === 'A') {
        btnModelA.className = "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-purple-600 text-white shadow-md";
        btnModelB.className = "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-600";
    } else {
        btnModelB.className = "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-blue-600 text-white shadow-md";
        btnModelA.className = "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-600";
    }
    
    fetchDataAndInitialize();
}

// Função para formatar números de forma robusta (evita erros se vier undefined ou texto)
function formatNumber(num, decimalPlaces = 2) {
    if (num === undefined || num === null || num === '' || num === '-') return '-';
    
    // Se for string, tenta converter, se falhar retorna o original
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return num;

    return parsed.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
}

// Função principal de busca
async function fetchDataAndInitialize() {
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-gray-400">Carregando dados do Modelo ${currentModel}...</td></tr>`;
    }

    try {
        const response = await fetch(apiUrls[currentModel]);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const apiJsonData = await response.json();
        
        let rawData = apiJsonData.message || apiJsonData;
        
        // Data geral da API (caso os itens não tenham data)
        const globalDate = apiJsonData.date 
            ? new Date(apiJsonData.date).toLocaleDateString('pt-BR') 
            : new Date().toLocaleDateString('pt-BR');

        // --- NORMALIZAÇÃO DOS DADOS ---
        investmentData = rawData.map(item => {
            return {
                ...item,
                // Padroniza Papel/Ticker
                papel: item.papel || item.ticker,
                
                // Padroniza Setor (Modelo A não tem, coloca traço)
                setor: item.setor || '-',
                
                // Padroniza Preço (Modelo A não tem, coloca 0 para não quebrar, mas vamos exibir "-" na tabela)
                preco: (item.preco !== undefined && item.preco !== null) ? item.preco : 0, 
                
                // Padroniza Data (Usa a data do item ou a data global da API)
                data: item.data || globalDate,
                
                // Garante que campos numéricos essenciais existam para evitar crash
                magic_formula: item.magic_formula || 9999,
                roic: item.roic || 0,
                ev_ebit: item.ev_ebit || 0,
                score: item.score || 0
            };
        });

        sortData('magic_formula');
        updateStats();

    } catch (error) {
        console.error("Erro:", error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-red-500">Erro ao carregar Modelo ${currentModel}. Verifique o console.</td></tr>`;
        }
    }
}

// Função para renderizar a tabela
function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = tableBody.insertRow();
        row.className = 'text-sm text-gray-300 hover:bg-gray-800 transition-colors duration-150';

        // Coluna Papel
        const papelCell = row.insertCell();
        papelCell.className = 'px-4 py-3 whitespace-nowrap font-bold text-white';
        papelCell.textContent = item.papel;

        // Coluna Setor
        row.insertCell().textContent = item.setor;

        // Coluna Preço (Tratamento especial se for 0/inexistente)
        const precoCell = row.insertCell();
        precoCell.textContent = item.preco === 0 ? 'N/A' : formatNumber(item.preco);

        // Coluna Data
        row.insertCell().textContent = item.data;

        // Coluna EV/EBIT
        const evEbitCell = row.insertCell();
        evEbitCell.textContent = formatNumber(item.ev_ebit);
        evEbitCell.className = getRankColorClass(item.rank_ev_ebit || 50); // Fallback rank

        // Coluna ROIC
        const roicCell = row.insertCell();
        roicCell.textContent = formatNumber(item.roic) + '%';
        roicCell.className = getRankColorClass(item.rank_roic || 50);

        // Ranks
        const rankRoicCell = row.insertCell();
        rankRoicCell.textContent = item.rank_roic || '-';
        rankRoicCell.className = getRankColorClass(item.rank_roic || 100);

        const rankEvEbitCell = row.insertCell();
        rankEvEbitCell.textContent = item.rank_ev_ebit || '-';
        rankEvEbitCell.className = getRankColorClass(item.rank_ev_ebit || 100);

        // Score
        const scoreCell = row.insertCell();
        scoreCell.textContent = item.score || '-';
        scoreCell.className = 'font-bold ' + getRankColorClass(item.score || 100);

        // Magic Formula
        const magicFormulaCell = row.insertCell();
        magicFormulaCell.textContent = item.magic_formula || '-';
        magicFormulaCell.className = 'font-bold text-lg ' + getRankColorClass(item.magic_formula || 100);

        // Adiciona classes padrão a todas as células
        Array.from(row.cells).forEach(cell => {
            if (!cell.classList.contains('px-4')) {
                cell.classList.add('px-4', 'py-3', 'whitespace-nowrap');
            }
        });
    });
}

// Lógica de Cores
function getRankColorClass(rank) {
    if (!rank || rank === '-') return 'text-gray-500';
    if (rank <= 15) return 'text-green-400 font-semibold';
    if (rank <= 40) return 'text-yellow-400';
    return 'text-red-400';
}

// Ordenação
function sortData(criteria) {
    const sortedData = [...investmentData].sort((a, b) => {
        // Função auxiliar para pegar valor numérico seguro
        const valA = (key) => typeof a[key] === 'number' ? a[key] : -999999;
        const valB = (key) => typeof b[key] === 'number' ? b[key] : -999999;

        switch (criteria) {
            case 'roic': return valB('roic') - valA('roic');
            case 'ev_ebit': return valA('ev_ebit') - valB('ev_ebit');
            case 'preco': return valB('preco') - valA('preco');
            case 'score': return valA('score') - valB('score');
            case 'papel': return a.papel.localeCompare(b.papel);
            case 'magic_formula':
            default: return valA('magic_formula') - valB('magic_formula');
        }
    });
    renderTable(sortedData);
}

// Stats (Cards no topo)
function updateStats() {
    const totalAcoesEl = document.getElementById('total-acoes');
    if (totalAcoesEl) totalAcoesEl.textContent = investmentData.length;

    // Helper para achar melhor/pior ignorando dados inválidos
    const validData = investmentData.filter(i => i.roic !== undefined && i.ev_ebit !== undefined);

    const melhorRoicEl = document.getElementById('melhor-roic');
    const melhorRoicPapelEl = document.getElementById('melhor-roic-papel');
    
    if (validData.length > 0 && melhorRoicEl) {
        const bestRoic = validData.reduce((prev, current) => (prev.roic > current.roic) ? prev : current);
        melhorRoicEl.textContent = formatNumber(bestRoic.roic) + '%';
        melhorRoicPapelEl.textContent = bestRoic.papel;
    }

    const menorEvEbitEl = document.getElementById('menor-ev-ebit');
    const menorEvEbitPapelEl = document.getElementById('menor-ev-ebit-papel');
    
    if (validData.length > 0 && menorEvEbitEl) {
        // Filtra valores negativos extremos ou zeros se necessário, aqui pegamos o menor absoluto
        const lowestEvEbit = validData.reduce((prev, current) => (prev.ev_ebit < current.ev_ebit) ? prev : current);
        menorEvEbitEl.textContent = formatNumber(lowestEvEbit.ev_ebit);
        menorEvEbitPapelEl.textContent = lowestEvEbit.papel;
    }

    const topMagicFormulaEl = document.getElementById('top-magic-formula');
    const topMagicFormulaPapelEl = document.getElementById('top-magic-formula-papel');
    
    if (validData.length > 0 && topMagicFormulaEl) {
        const topMagic = validData.reduce((prev, current) => (prev.magic_formula < current.magic_formula) ? prev : current);
        topMagicFormulaEl.textContent = '#' + topMagic.magic_formula;
        topMagicFormulaPapelEl.textContent = topMagic.papel;
    }
}

// Event Listeners
if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
        sortData(event.target.value);
    });
}

if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
}

// Inicialização
fetchDataAndInitialize();
