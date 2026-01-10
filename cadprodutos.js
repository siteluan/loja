// ===== SISTEMA DE CADASTRO DE PRODUTOS =====

// Elementos DOM
const produtoForm = document.getElementById('produtoForm');
const nomeProduto = document.getElementById('nomeProduto');
const descricaoProduto = document.getElementById('descricaoProduto');
const imagemURL = document.getElementById('imagemURL');
const quantidadeEstoque = document.getElementById('quantidadeEstoque');
const statusProduto = document.getElementById('statusProduto');
const statusText = document.getElementById('statusText');
const categoriaProduto = document.getElementById('categoriaProduto');
const precoProduto = document.getElementById('precoProduto');
const limparFormBtn = document.getElementById('limparForm');
const submitBtn = document.getElementById('submitBtn');
const produtosLista = document.getElementById('produtosLista');
const loadingProdutos = document.getElementById('loadingProdutos');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const totalExibidos = document.getElementById('totalExibidos');
const panelSubtitle = document.getElementById('panelSubtitle');
const infoText = document.getElementById('infoText');
const imagePreview = document.getElementById('imagePreview');
const stockBar = document.getElementById('stockBar');
const stockLevel = document.getElementById('stockLevel');

// Elementos da sidebar (novos)
const produtosAtivosElement = document.getElementById('produtosAtivos');
const produtosEstoqueElement = document.getElementById('produtosEstoque');
const btnVoltarDashboard = document.getElementById('btnVoltarDashboard');
const menuToggle = document.getElementById('menuToggle');

// Elementos de tipo de produto
const tipoProdutoInput = document.getElementById('tipoProduto');
const categoriasAdicionaisContainer = document.getElementById('categoriasAdicionaisContainer');

// Elementos de botões
const btnAtualizar = document.getElementById('btnAtualizar');
const btnPreviewImagem = document.getElementById('btnPreviewImagem');
const btnVerTodos = document.getElementById('btnVerTodos');

// Elementos de filtro
const filterTags = document.querySelectorAll('.filter-tag');

// Estado global
let produtos = [];
let produtosFiltrados = [];
let isSubmitting = false;
let currentFilter = 'todos';
let produtoEditando = null; // Armazena o ID do produto em edição

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Produtos inicializado');
    
    inicializarFirebase();
    setupEventListeners();
    inicializarIndicadores();
    carregarProdutos();
    carregarEstatisticasSidebar();
});

// ===== SIDEBAR E NAVEGAÇÃO =====

// Carregar estatísticas da sidebar
function carregarEstatisticasSidebar() {
    db.collection('produtos').onSnapshot((snapshot) => {
        let totalAtivos = 0;
        let totalBaixoEstoque = 0;
        
        snapshot.forEach((doc) => {
            const produto = doc.data();
            
            // Contar produtos ativos
            if (produto.status === true || produto.status === 'on') {
                totalAtivos++;
            }
            
            // Contar produtos com baixo estoque (menos de 10 unidades)
            // CORREÇÃO: Verificar ambos os campos para compatibilidade
            const estoque = parseInt(produto.quantidade || produto.quantidadeEstoque) || 0;
            if (estoque > 0 && estoque < 10) {
                totalBaixoEstoque++;
            }
        });
        
        // Atualizar elementos da sidebar
        if (produtosAtivosElement) {
            produtosAtivosElement.textContent = totalAtivos;
        }
        if (produtosEstoqueElement) {
            produtosEstoqueElement.textContent = totalBaixoEstoque;
        }
    }, (error) => {
        console.error('Erro ao carregar estatísticas:', error);
    });
}

// Voltar para o dashboard
function voltarParaDashboard() {
    window.location.href = 'dashboard.html'; // Ajuste para sua página inicial
}

// Toggle do menu mobile
function toggleMenuMobile() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// ===== CONFIGURAÇÃO INICIAL =====

// Inicializar Firebase
function inicializarFirebase() {
    try {
        console.log('✅ Firebase configurado');
        
        // Testar conexão
        testarConexaoFirebase();
    } catch (error) {
        console.error('❌ Erro no Firebase:', error);
        mostrarToast('Erro na conexão com o banco de dados', 'error');
    }
}

// Testar conexão Firebase
async function testarConexaoFirebase() {
    try {
        await db.collection("teste").limit(1).get();
        console.log('✅ Conexão Firebase estabelecida');
    } catch (error) {
        console.error('❌ Falha na conexão Firebase');
    }
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Formulário
    produtoForm.addEventListener('submit', cadastrarProduto);
    
    // Limpar formulário
    limparFormBtn.addEventListener('click', limparFormulario);
    
    // Status do produto
    statusProduto.addEventListener('change', atualizarStatusTexto);
    
    // Preview da imagem
    btnPreviewImagem.addEventListener('click', atualizarPreviewImagem);
    imagemURL.addEventListener('input', debounce(atualizarPreviewImagem, 300));
    
    // Indicador de estoque
    quantidadeEstoque.addEventListener('input', atualizarIndicadorEstoque);
    
    // Busca
    searchInput.addEventListener('input', debounce(filtrarProdutos, 300));
    
    // Botões de tipo de produto
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selecionarTipo(this.dataset.type);
        });
    });
    
    // Botões de filtro
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            filtrarPorStatus(this.dataset.filter);
        });
    });
    
    // Botão atualizar
    btnAtualizar.addEventListener('click', recarregarProdutos);
    
    // Botão ver todos
    btnVerTodos.addEventListener('click', mostrarTodosProdutos);
    
    // Botão voltar
    if (btnVoltarDashboard) {
        btnVoltarDashboard.addEventListener('click', voltarParaDashboard);
    }
    
    // Menu toggle mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenuMobile);
    }
}

// Inicializar indicadores
function inicializarIndicadores() {
    atualizarStatusTexto();
    atualizarIndicadorEstoque();
}

// ===== FUNÇÕES DE FORMULÁRIO =====

// Selecionar tipo de produto
function selecionarTipo(tipo) {
    const buttons = document.querySelectorAll('.type-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === tipo) {
            btn.classList.add('active');
        }
    });
    
    tipoProdutoInput.value = tipo;
    
    // Mostrar/ocultar categorias para adicionais
    if (tipo === 'adicional') {
        categoriasAdicionaisContainer.style.display = 'block';
        setTimeout(() => {
            categoriasAdicionaisContainer.classList.add('fade-in');
        }, 10);
    } else {
        categoriasAdicionaisContainer.style.display = 'none';
    }
}

// Atualizar texto do status
function atualizarStatusTexto() {
    const isAtivo = statusProduto.checked;
    statusText.textContent = isAtivo ? 'Ativo' : 'Inativo';
    statusText.className = isAtivo ? 'status-text active' : 'status-text inactive';
}

// Atualizar indicador de estoque
function atualizarIndicadorEstoque() {
    const quantidade = parseInt(quantidadeEstoque.value) || 0;
    let nivel = 'Bom';
    let cor = '#00bb9c';
    let porcentagem = 100;
    
    if (quantidade === 0) {
        nivel = 'Esgotado';
        cor = '#ff5a5a';
        porcentagem = 0;
    } else if (quantidade <= 5) {
        nivel = 'Baixo';
        cor = '#ff9e00';
        porcentagem = 30;
    } else if (quantidade <= 10) {
        nivel = 'Moderado';
        cor = '#ffd166';
        porcentagem = 60;
    }
    
    stockBar.style.width = `${porcentagem}%`;
    stockBar.style.background = cor;
    stockLevel.textContent = nivel;
    stockLevel.style.color = cor;
}

// Atualizar preview da imagem
function atualizarPreviewImagem() {
    const url = imagemURL.value.trim();
    
    if (url && isValidURL(url)) {
        imagePreview.innerHTML = `
            <img src="${url}" alt="Preview" onerror="handleImageError()">
        `;
    } else {
        imagePreview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-image"></i>
                <p>Nenhuma imagem selecionada</p>
                <small>URL válida mostrará a imagem aqui</small>
            </div>
        `;
    }
}

// Validar URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Tratar erro de imagem
function handleImageError() {
    imagePreview.innerHTML = `
        <div class="preview-placeholder">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar imagem</p>
            <small>Verifique a URL ou tente outra imagem</small>
        </div>
    `;
}

// ===== CADASTRO DE PRODUTOS =====

async function cadastrarProduto(event) {
    event.preventDefault();
    
    if (isSubmitting) return;
    isSubmitting = true;
    
    // Validar dados
    if (!validarFormulario()) {
        isSubmitting = false;
        return;
    }
    
    // Preparar dados
    // CORREÇÃO: Salvar em ambos os campos para compatibilidade
    const produtoData = {
        nome: nomeProduto.value.trim(),
        descricao: descricaoProduto.value.trim(),
        categoria: categoriaProduto.value,
        preco: parseFloat(precoProduto.value),
        quantidade: parseInt(quantidadeEstoque.value) || 0,  // CORREÇÃO: Adicionar campo 'quantidade'
        quantidadeEstoque: parseInt(quantidadeEstoque.value) || 0,  // Manter campo antigo para compatibilidade
        status: statusProduto.checked ? 'on' : 'off',
        tipo: tipoProdutoInput.value,
        dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
        dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Adicionar URL da imagem se existir
    const urlImagem = imagemURL.value.trim();
    if (urlImagem && isValidURL(urlImagem)) {
        produtoData.imagemURL = urlImagem;
    }
    
    // Adicionar categorias para adicionais
    if (produtoData.tipo === 'adicional') {
        const categorias = [];
        document.querySelectorAll('.category-chip input:checked').forEach(cb => {
            categorias.push(cb.value);
        });
        produtoData.categoriasAdicionais = categorias;
    }
    
    try {
        // Mostrar loading
        if (produtoEditando) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
        } else {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
        }
        submitBtn.disabled = true;
        
        // Se estiver editando, atualizar produto existente
        if (produtoEditando) {
            await db.collection("produtos").doc(produtoEditando).update({
                ...produtoData,
                dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarToast('Produto atualizado com sucesso!', 'success');
            produtoEditando = null;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Cadastrar Produto';
        } else {
            // Senão, criar novo produto
            await db.collection("produtos").add(produtoData);
            mostrarToast('Produto cadastrado com sucesso!', 'success');
        }
        
        // Limpar formulário
        setTimeout(limparFormulario, 500);
        
        // Recarregar produtos
        setTimeout(carregarProdutos, 1000);
        
        // Atualizar estatísticas da sidebar
        carregarEstatisticasSidebar();
        
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        mostrarToast('Erro ao salvar produto', 'error');
    } finally {
        // Restaurar botão
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Cadastrar Produto';
            submitBtn.disabled = false;
            isSubmitting = false;
        }, 1000);
    }
}

// Validar formulário
function validarFormulario() {
    // Validar nome
    if (!nomeProduto.value.trim()) {
        mostrarToast('Digite o nome do produto', 'error');
        nomeProduto.focus();
        return false;
    }
    
    // Validar preço
    const preco = parseFloat(precoProduto.value);
    if (isNaN(preco) || preco < 0) {
        mostrarToast('Preço inválido', 'error');
        precoProduto.focus();
        return false;
    }
    
    // Validar URL da imagem
    const urlImagem = imagemURL.value.trim();
    if (urlImagem && !isValidURL(urlImagem)) {
        mostrarToast('URL da imagem inválida', 'error');
        imagemURL.focus();
        return false;
    }
    
    // Validar adicionais
    if (tipoProdutoInput.value === 'adicional') {
        const categoriasSelecionadas = document.querySelectorAll('.category-chip input:checked').length;
        if (categoriasSelecionadas === 0) {
            mostrarToast('Selecione pelo menos uma categoria para o adicional', 'error');
            return false;
        }
    }
    
    return true;
}

// Limpar formulário
function limparFormulario() {
    produtoForm.reset();
    tipoProdutoInput.value = 'normal';
    categoriasAdicionaisContainer.style.display = 'none';
    
    // Resetar botões de tipo
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === 'normal') {
            btn.classList.add('active');
        }
    });
    
    // Resetar checkboxes
    document.querySelectorAll('.category-chip input').forEach(cb => {
        cb.checked = false;
    });
    
    // Resetar preview
    atualizarPreviewImagem();
    
    // Resetar indicadores
    atualizarStatusTexto();
    atualizarIndicadorEstoque();
    
    // Resetar estado de edição
    produtoEditando = null;
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Cadastrar Produto';
    submitBtn.disabled = false;
    
    // Atualizar título do formulário
    document.querySelector('.form-section h2').innerHTML = '<i class="fas fa-edit"></i> Informações do Produto';
    
    // Focar no primeiro campo
    nomeProduto.focus();
    
    // NOTIFICAÇÃO REMOVIDA: Não mostrar toast ao limpar formulário
}

// ===== CARREGAMENTO DE PRODUTOS =====

function carregarProdutos() {
    if (!produtosLista) return;
    
    mostrarLoading(true);
    
    const unsubscribe = db.collection("produtos")
        .orderBy("dataCadastro", "desc")
        .onSnapshot({
            next: (snapshot) => {
                produtos = [];
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    produtos.push({
                        id: doc.id,
                        ...data,
                        // CORREÇÃO: Garantir que quantidade seja lida corretamente
                        quantidade: data.quantidade || data.quantidadeEstoque || 0,
                        dataCadastro: data.dataCadastro ? 
                            data.dataCadastro.toDate() : new Date()
                    });
                });
                
                console.log(`📦 ${produtos.length} produtos carregados`);
                
                filtrarProdutos();
                mostrarLoading(false);
                
                // Atualizar interface
                if (produtos.length === 0) {
                    mostrarEmptyState(true);
                } else {
                    mostrarEmptyState(false);
                }
            },
            error: (error) => {
                console.error('Erro ao carregar produtos:', error);
                mostrarToast('Erro ao carregar produtos', 'error');
                mostrarLoading(false);
                mostrarEmptyState(true);
            }
        });
    
    // Limpar listener ao sair
    window.addEventListener('beforeunload', () => unsubscribe());
}

// Mostrar/ocultar loading
function mostrarLoading(show) {
    if (loadingProdutos) {
        loadingProdutos.style.display = show ? 'flex' : 'none';
    }
    if (produtosLista) {
        produtosLista.style.display = show ? 'none' : 'grid';
    }
}

// Mostrar/ocultar estado vazio
function mostrarEmptyState(show) {
    if (emptyState) {
        emptyState.style.display = show ? 'block' : 'none';
    }
}

// ===== FILTRAGEM E EXIBIÇÃO =====

// Filtrar por status
function filtrarPorStatus(status) {
    currentFilter = status;
    
    // Atualizar botões
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    event.target.classList.add('active');
    
    filtrarProdutos();
}

// Filtrar produtos
function filtrarProdutos() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    produtosFiltrados = produtos.filter(produto => {
        // Filtro por busca
        const matchesSearch = searchTerm === '' ||
            produto.nome.toLowerCase().includes(searchTerm) ||
            (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm));
        
        // Filtro por status
        const matchesStatus = currentFilter === 'todos' ||
            (currentFilter === 'on' && produto.status === 'on') ||
            (currentFilter === 'off' && produto.status === 'off');
        
        return matchesSearch && matchesStatus;
    });
    
    renderizarProdutos();
    atualizarEstatisticasExibidas();
}

// Renderizar produtos
function renderizarProdutos() {
    if (!produtosLista) return;
    
    produtosLista.innerHTML = '';
    
    if (produtosFiltrados.length === 0) {
        produtosLista.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar os filtros ou a busca</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data (mais recentes primeiro)
    produtosFiltrados.sort((a, b) => b.dataCadastro - a.dataCadastro);
    
    // Limitar a 6 produtos por padrão
    const produtosParaExibir = produtosFiltrados.slice(0, 6);
    
    produtosParaExibir.forEach((produto, index) => {
        criarCardProduto(produto, index);
    });
}

// Criar card de produto
function criarCardProduto(produto, index) {
    const card = document.createElement('div');
    card.className = `product-card ${produto.status === 'off' ? 'inactive' : ''}`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Configurar estoque
    let estoqueClass = '';
    let estoqueIcon = 'fa-box';
    // CORREÇÃO: Usar campo 'quantidade' se disponível, senão 'quantidadeEstoque'
    const estoqueProduto = produto.quantidade || produto.quantidadeEstoque || 0;
    let estoqueText = estoqueProduto;
    
    if (estoqueProduto === 0) {
        estoqueClass = 'empty';
        estoqueIcon = 'fa-times-circle';
        estoqueText = '0';
    } else if (estoqueProduto <= 5) {
        estoqueClass = 'low';
        estoqueIcon = 'fa-exclamation-triangle';
        estoqueText = estoqueProduto;
    }
    
    // Formatar preço
    const precoFormatado = produto.preco ? 
        produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00';
    
    // Formatar categoria
    const categoriaMap = {
        'comida': '🍕 Comida',
        'bebida': '🥤 Bebida', 
        'sobremesa': '🍰 Sobremesa',
        'outro': '📦 Outro'
    };
    const categoriaTexto = categoriaMap[produto.categoria] || 'Outro';
    
    // Data formatada
    const dataFormatada = formatarData(produto.dataCadastro);
    
    card.innerHTML = `
        ${produto.tipo === 'adicional' ? 
            '<div class="badge-additional" title="Produto Adicional"><i class="fas fa-plus"></i></div>' : ''
        }
        
        <div class="product-card-header">
            <div class="product-image">
                ${produto.imagemURL ? 
                    `<img src="${produto.imagemURL}" alt="${produto.nome}" onerror="handleImageError.call(this)">` :
                    `<i class="fas fa-box"></i>`
                }
            </div>
            <div class="product-info">
                <h3 class="product-title" title="${produto.nome}">${produto.nome}</h3>
                <div class="product-meta">
                    <span class="product-category">
                        <i class="fas fa-tag"></i>
                        ${categoriaTexto}
                    </span>
                    <span class="product-status ${produto.status === 'on' ? 'status-active' : 'status-inactive'}">
                        ${produto.status === 'on' ? 'ATIVO' : 'INATIVO'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="product-card-body">
            ${produto.descricao ? 
                `<p class="product-description" title="${produto.descricao}">${produto.descricao}</p>` :
                '<p class="product-description" style="color: var(--text-muted); font-style: italic;">Sem descrição</p>'
            }
            
            <div class="product-stats">
                <div class="product-stat">
                    <span class="stat-label">Preço</span>
                    <span class="stat-value price">R$ ${precoFormatado}</span>
                </div>
                <div class="product-stat">
                    <span class="stat-label">Estoque</span>
                    <span class="stat-value stock ${estoqueClass}">
                        <i class="fas ${estoqueIcon}"></i> ${estoqueText}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="product-card-footer">
            <button class="product-action toggle" onclick="alternarStatusProduto('${produto.id}', ${produto.status === 'on'})">
                <i class="fas ${produto.status === 'on' ? 'fa-toggle-off' : 'fa-toggle-on'}"></i>
                ${produto.status === 'on' ? 'Desativar' : 'Ativar'}
            </button>
            <!-- BOTÃO EDITAR ADICIONADO AQUI -->
            <button class="product-action edit" onclick="editarProduto('${produto.id}')">
                <i class="fas fa-edit"></i>
                Editar
            </button>
            <button class="product-action delete" onclick="excluirProduto('${produto.id}', '${produto.nome}')">
                <i class="fas fa-trash-alt"></i>
                Excluir
            </button>
        </div>
    `;
    
    produtosLista.appendChild(card);
}

// ===== ESTATÍSTICAS =====

// Atualizar estatísticas exibidas
function atualizarEstatisticasExibidas() {
    if (totalExibidos) {
        totalExibidos.textContent = produtosFiltrados.length;
    }
    
    if (panelSubtitle) {
        panelSubtitle.innerHTML = `Total: <span id="totalExibidos">${produtosFiltrados.length}</span> produtos`;
    }
    
    if (infoText) {
        const texto = produtosFiltrados.length === produtos.length ? 
            'Mostrando todos os produtos' :
            `Mostrando ${produtosFiltrados.length} de ${produtos.length} produtos`;
        infoText.textContent = texto;
    }
}

// ===== OPERAÇÕES CRUD =====

// Alternar status do produto
async function alternarStatusProduto(id, estaAtivo) {
    try {
        const novoStatus = estaAtivo ? 'off' : 'on';
        await db.collection("produtos").doc(id).update({
            status: novoStatus,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // NOTIFICAÇÃO REMOVIDA: Não mostrar toast ao alternar status
        // Apenas atualizar a interface silenciosamente
        
        // Atualizar estatísticas da sidebar
        carregarEstatisticasSidebar();
    } catch (error) {
        console.error('Erro ao alternar status:', error);
        mostrarToast('Erro ao alterar status do produto', 'error');
    }
}

// Editar produto
async function editarProduto(id) {
    try {
        // Buscar dados do produto
        const doc = await db.collection("produtos").doc(id).get();
        if (!doc.exists) {
            mostrarToast('Produto não encontrado', 'error');
            return;
        }
        
        const produto = doc.data();
        
        // Preencher formulário com dados do produto
        nomeProduto.value = produto.nome || '';
        descricaoProduto.value = produto.descricao || '';
        categoriaProduto.value = produto.categoria || 'outro';
        precoProduto.value = produto.preco || 0;
        
        // Usar quantidade se existir, senão usar quantidadeEstoque
        quantidadeEstoque.value = produto.quantidade || produto.quantidadeEstoque || 0;
        
        statusProduto.checked = produto.status === 'on';
        atualizarStatusTexto();
        
        tipoProdutoInput.value = produto.tipo || 'normal';
        
        // Selecionar tipo correto
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === (produto.tipo || 'normal')) {
                btn.classList.add('active');
            }
        });
        
        // Mostrar/ocultar categorias para adicionais
        if (produto.tipo === 'adicional') {
            categoriasAdicionaisContainer.style.display = 'block';
            
            // Marcar checkboxes de categorias
            document.querySelectorAll('.category-chip input').forEach(cb => {
                cb.checked = produto.categoriasAdicionais && 
                            produto.categoriasAdicionais.includes(cb.value);
            });
        } else {
            categoriasAdicionaisContainer.style.display = 'none';
        }
        
        imagemURL.value = produto.imagemURL || '';
        atualizarPreviewImagem();
        atualizarIndicadorEstoque();
        
        // Armazenar ID do produto em edição
        produtoEditando = id;
        
        // Atualizar botão e título do formulário
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Produto';
        document.querySelector('.form-section h2').innerHTML = '<i class="fas fa-edit"></i> Editar Produto';
        
        // Rolar para o topo do formulário
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        // Focar no primeiro campo
        nomeProduto.focus();
        
        // NOTIFICAÇÃO REMOVIDA: Não mostrar toast ao carregar produto para edição
        
    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error);
        mostrarToast('Erro ao carregar produto', 'error');
    }
}

// Excluir produto
async function excluirProduto(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"?\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        await db.collection("produtos").doc(id).delete();
        
        // NOTIFICAÇÃO REMOVIDA: Não mostrar toast ao excluir produto
        // Apenas remover da interface silenciosamente
        
        // Se estava editando este produto, limpar formulário
        if (produtoEditando === id) {
            limparFormulario();
        }
        
        // Atualizar estatísticas da sidebar
        carregarEstatisticasSidebar();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        mostrarToast('Erro ao excluir produto', 'error');
    }
}

// Mostrar todos os produtos
function mostrarTodosProdutos() {
    if (!produtosLista) return;
    
    produtosLista.innerHTML = '';
    produtosFiltrados.forEach((produto, index) => {
        criarCardProduto(produto, index);
    });
    
    infoText.textContent = `Mostrando todos os ${produtosFiltrados.length} produtos`;
    // NOTIFICAÇÃO REMOVIDA: Não mostrar toast ao ver todos os produtos
}

// Recarregar produtos
function recarregarProdutos() {
    // NOTIFICAÇÃO REMOVIDA: Não mostrar toast ao recarregar
    carregarProdutos();
}

// ===== UTILITÁRIOS =====

// Formatar data
function formatarData(data) {
    const agora = new Date();
    const dataProduto = new Date(data);
    const diffMs = agora - dataProduto;
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMinutos < 1) return 'Agora';
    if (diffMinutos < 60) return `${diffMinutos}m`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    
    return dataProduto.toLocaleDateString('pt-BR');
}

// Debounce para performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== NOTIFICAÇÕES TOAST =====

function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[tipo] || 'fa-info-circle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${tipo === 'success' ? 'Sucesso' : tipo === 'error' ? 'Erro' : 'Aviso'}</div>
            <div class="toast-message">${mensagem}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// ===== FUNÇÕES GLOBAIS =====
window.selecionarTipo = selecionarTipo;
window.atualizarPreviewImagem = atualizarPreviewImagem;
window.handleImageError = handleImageError;
window.filtrarPorStatus = filtrarPorStatus;
window.mostrarTodosProdutos = mostrarTodosProdutos;
window.recarregarProdutos = recarregarProdutos;
window.alternarStatusProduto = alternarStatusProduto;
window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;
window.voltarParaDashboard = voltarParaDashboard;
window.toggleMenuMobile = toggleMenuMobile;

// Função para migrar produtos antigos (opcional)
async function migrarProdutos() {
    if (!confirm('Deseja migrar produtos antigos para usar o novo campo "quantidade"?')) {
        return;
    }
    
    try {
        // NOTIFICAÇÃO REMOVIDA: Não mostrar toast durante migração
        
        const snapshot = await db.collection("produtos").get();
        const batch = db.batch();
        let migrados = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.quantidadeEstoque && !data.quantidade) {
                const ref = db.collection("produtos").doc(doc.id);
                batch.update(ref, {
                    quantidade: data.quantidadeEstoque,
                    dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
                });
                migrados++;
            }
        });
        
        await batch.commit();
        mostrarToast(`${migrados} produtos migrados com sucesso!`, 'success');
        
        // Recarregar produtos
        setTimeout(carregarProdutos, 1000);
        
    } catch (error) {
        console.error('Erro na migração:', error);
        mostrarToast('Erro na migração', 'error');
    }
}

// Tornar função de migração disponível globalmente
window.migrarProdutos = migrarProdutos;