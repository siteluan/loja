// Sistema de Cardápio para Clientes - Com integração para vendas pendentes

// Estado da aplicação
let produtos = [];
let categorias = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let carrinhoAberto = false;
let categoriasRenderizadas = false;

// Elementos do DOM
const produtosGrid = document.getElementById('produtosGrid');
const categoriasList = document.getElementById('categoriasList');
const searchProdutos = document.getElementById('searchProdutos');
const carrinhoInfo = document.getElementById('carrinhoInfo');
const carrinhoCount = document.getElementById('carrinhoCount');
const carrinhoTotal = document.getElementById('carrinhoTotal');
const verCarrinhoBtn = document.getElementById('verCarrinhoBtn');
const carrinhoModal = document.getElementById('carrinhoModal');
const closeCarrinhoBtn = document.getElementById('closeCarrinhoBtn');
const carrinhoEmpty = document.getElementById('carrinhoEmpty');
const carrinhoItems = document.getElementById('carrinhoItems');
const limparCarrinhoBtn = document.getElementById('limparCarrinhoBtn');
const finalizarPedidoBtn = document.getElementById('finalizarPedidoBtn');
const subtotal = document.getElementById('subtotal');
const totalCarrinho = document.getElementById('totalCarrinho');
const produtoModal = document.getElementById('produtoModal');
const produtoModalBody = document.getElementById('produtoModalBody');
const closeProdutoBtn = document.getElementById('closeProdutoBtn');

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    console.log("Iniciando cardápio...");
    
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase não carregado!");
        mostrarErro("Erro ao carregar o cardápio. Recarregue a página.");
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar produtos
    carregarProdutos();
    
    // Atualizar carrinho
    atualizarCarrinho();
});

// Mostrar erro
function mostrarErro(mensagem) {
    const produtosGrid = document.getElementById('produtosGrid');
    if (produtosGrid) {
        produtosGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 16px;"></i>
                <h3 style="color: #1e293b; margin-bottom: 8px;">${mensagem}</h3>
                <p style="color: #64748b; margin-bottom: 16px;">Tente recarregar a página</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-redo"></i> Recarregar
                </button>
            </div>
        `;
    }
}

// Configurar eventos
function setupEventListeners() {
    // Busca de produtos
    if (searchProdutos) searchProdutos.addEventListener('input', filtrarProdutos);
    
    // Carrinho
    if (carrinhoInfo) carrinhoInfo.addEventListener('click', abrirCarrinho);
    if (verCarrinhoBtn) verCarrinhoBtn.addEventListener('click', abrirCarrinho);
    if (closeCarrinhoBtn) closeCarrinhoBtn.addEventListener('click', fecharCarrinho);
    if (limparCarrinhoBtn) limparCarrinhoBtn.addEventListener('click', limparCarrinho);
    if (finalizarPedidoBtn) finalizarPedidoBtn.addEventListener('click', finalizarPedido);
    
    // Modal do produto
    if (closeProdutoBtn) closeProdutoBtn.addEventListener('click', fecharModalProduto);
    
    // Fechar modais ao clicar fora
    if (carrinhoModal) {
        carrinhoModal.addEventListener('click', function(e) {
            if (e.target === carrinhoModal) fecharCarrinho();
        });
    }
    
    if (produtoModal) {
        produtoModal.addEventListener('click', function(e) {
            if (e.target === produtoModal) fecharModalProduto();
        });
    }
    
    // Configurar evento do botão "Todos" manualmente
    const todosBtn = document.querySelector('[data-categoria="todos"]');
    if (todosBtn) {
        todosBtn.addEventListener('click', function() {
            filtrarPorCategoria('todos');
        });
    }
}

// Carregar produtos do Firebase
function carregarProdutos() {
    console.log("Conectando ao Firebase...");
    
    const db = firebase.firestore();
    const loadingElement = produtosGrid ? produtosGrid.querySelector('.loading-produtos') : null;
    const emptyState = document.getElementById('emptyState');
    
    // Mostrar loading
    if (loadingElement) loadingElement.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    
    // Configurar listener em tempo real
    const unsubscribe = db.collection("produtos")
        .where("status", "==", "on")
        .onSnapshot(
            // Sucesso
            (snapshot) => {
                console.log(`✅ Recebidos ${snapshot.size} produtos`);
                
                produtos = [];
                categorias = new Set(['todos']);
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const quantidadeProduto = data.quantidade || data.quantidadeEstoque || 0;
                    
                    produtos.push({
                        id: doc.id,
                        nome: data.nome || "Produto sem nome",
                        descricao: data.descricao || "",
                        preco: data.preco || 0,
                        quantidade: quantidadeProduto,
                        categoria: data.categoria || "outro",
                        imagemURL: data.imagemURL || "",
                        status: data.status || "off",
                        quantidadeEstoque: quantidadeProduto
                    });
                    
                    if (data.categoria) {
                        categorias.add(data.categoria);
                    }
                });
                
                console.log(`📊 ${produtos.length} produtos processados`);
                console.log(`📁 Categorias encontradas: ${Array.from(categorias).join(', ')}`);
                
                // Renderizar produtos
                renderizarProdutos(produtos);
                
                // Renderizar categorias apenas se ainda não foram renderizadas
                if (!categoriasRenderizadas) {
                    renderizarCategorias();
                    categoriasRenderizadas = true;
                } else {
                    // Se já foram renderizadas, apenas atualizar se necessário
                    atualizarCategoriasSeNecessario();
                }
                
                // Esconder loading
                if (loadingElement) loadingElement.style.display = 'none';
                
                // Mostrar empty state se não houver produtos
                if (produtos.length === 0 && emptyState) {
                    emptyState.style.display = 'block';
                }
            },
            // Erro
            (error) => {
                console.error("❌ Erro ao carregar produtos:", error);
                
                if (loadingElement) {
                    loadingElement.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Erro ao carregar produtos</h3>
                            <p>${error.message || 'Verifique sua conexão'}</p>
                            <button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                <i class="fas fa-redo"></i> Tentar novamente
                            </button>
                        </div>
                    `;
                }
                
                mostrarNotificacao('Erro ao carregar produtos', 'error');
            }
        );
    
    // Armazenar função para limpar listener se necessário
    return unsubscribe;
}

// Renderizar produtos
function renderizarProdutos(listaProdutos) {
    if (!produtosGrid) return;
    
    produtosGrid.innerHTML = '';
    
    if (listaProdutos.length === 0) {
        produtosGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente outra busca ou categoria</p>
            </div>
        `;
        return;
    }
    
    listaProdutos.forEach(produto => {
        const produtoElement = criarElementoProduto(produto);
        produtosGrid.appendChild(produtoElement);
    });
}

// Criar elemento de produto
function criarElementoProduto(produto) {
    const div = document.createElement('div');
    div.className = 'produto-card';
    
    const temEstoque = produto.quantidade > 0;
    const statusTexto = temEstoque ? 'Disponível' : 'Esgotado';
    const statusClasse = temEstoque ? '' : 'out';
    
    const precoFormatado = produto.preco.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    const categoriaFormatada = produto.categoria ? 
        produto.categoria.charAt(0).toUpperCase() + produto.categoria.slice(1) : 
        'Outro';
    
    div.innerHTML = `
        <div class="produto-status ${statusClasse}">
            ${statusTexto}
        </div>
        <div class="produto-image">
            ${produto.imagemURL ? 
                `<img src="${produto.imagemURL}" alt="${produto.nome}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<div style=\"display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #64748b;\"><i class=\"fas fa-image\"></i></div>'">` : 
                `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #64748b;">
                    <i class="fas fa-image"></i>
                </div>`
            }
        </div>
        <div class="produto-info">
            <div class="produto-header">
                <h3 class="produto-name">${produto.nome}</h3>
                <span class="produto-category">${categoriaFormatada}</span>
            </div>
            <p class="produto-description">${produto.descricao || 'Sem descrição'}</p>
            <div class="produto-details">
                <span class="produto-price">${precoFormatado}</span>
                <span class="produto-stock">
                    ${produto.quantidade > 5 ? 
                        `<i class="fas fa-check-circle"></i> Em estoque` : 
                        produto.quantidade > 0 ? 
                            `<i class="fas fa-exclamation-triangle"></i> Últimas ${produto.quantidade}` : 
                            `<i class="fas fa-times-circle"></i> Esgotado`
                    }
                </span>
            </div>
            <div class="produto-actions">
                <button class="btn-add-cart" onclick="adicionarAoCarrinho('${produto.id}')" ${!temEstoque ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i>
                    ${temEstoque ? 'Adicionar' : 'Esgotado'}
                </button>
                <button class="btn-details" onclick="verDetalhesProduto('${produto.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Renderizar categorias (CORRIGIDA)
function renderizarCategorias() {
    const loadingCategorias = categoriasList ? categoriasList.querySelector('.loading-categorias') : null;
    if (loadingCategorias) loadingCategorias.style.display = 'none';
    
    // Encontrar o botão "Todos" original
    const todosBtnOriginal = categoriasList ? categoriasList.querySelector('[data-categoria="todos"]') : null;
    
    // Se não encontrar o botão "Todos", criar um novo
    if (!todosBtnOriginal) {
        console.warn("Botão 'Todos' não encontrado, criando novo...");
        criarBotaoTodos();
    } else {
        // Garantir que o botão "Todos" tenha o event listener
        if (!todosBtnOriginal.hasAttribute('data-listener-adicionado')) {
            todosBtnOriginal.addEventListener('click', () => filtrarPorCategoria('todos'));
            todosBtnOriginal.setAttribute('data-listener-adicionado', 'true');
        }
    }
    
    // Remover todos os outros botões de categoria (exceto "Todos" e loading)
    const outrosBotoes = categoriasList ? categoriasList.querySelectorAll('.categoria-btn:not([data-categoria="todos"])') : [];
    outrosBotoes.forEach(botao => botao.remove());
    
    // Adicionar botões para cada categoria (exceto 'todos')
    Array.from(categorias)
        .filter(cat => cat !== 'todos')
        .forEach(categoria => {
            const btn = document.createElement('button');
            btn.className = 'categoria-btn';
            btn.dataset.categoria = categoria;
            
            let icon = 'fa-utensils';
            if (categoria === 'bebida' || categoria === 'bebidas') icon = 'fa-glass-martini-alt';
            if (categoria === 'sobremesa' || categoria === 'sobremesas') icon = 'fa-ice-cream';
            if (categoria === 'lanche' || categoria === 'lanches') icon = 'fa-hamburger';
            if (categoria === 'comida') icon = 'fa-utensil-spoon';
            
            btn.innerHTML = `<i class="fas ${icon}"></i> ${formatarNomeCategoria(categoria)}`;
            btn.addEventListener('click', () => filtrarPorCategoria(categoria));
            if (categoriasList) categoriasList.appendChild(btn);
        });
}

// Criar botão "Todos" se não existir
function criarBotaoTodos() {
    if (!categoriasList) return;
    
    const todosBtn = document.createElement('button');
    todosBtn.className = 'categoria-btn active';
    todosBtn.dataset.categoria = 'todos';
    todosBtn.dataset.listenerAdicionado = 'true';
    todosBtn.innerHTML = '<i class="fas fa-star"></i> Todos';
    todosBtn.addEventListener('click', () => filtrarPorCategoria('todos'));
    
    // Remover loading se existir
    const loadingCategorias = categoriasList.querySelector('.loading-categorias');
    if (loadingCategorias) {
        loadingCategorias.remove();
    }
    
    // Adicionar como primeiro elemento
    categoriasList.insertBefore(todosBtn, categoriasList.firstChild);
}

// Atualizar categorias se necessário (apenas se novas categorias foram adicionadas)
function atualizarCategoriasSeNecessario() {
    if (!categoriasList) return;
    
    // Verificar quais categorias já estão renderizadas
    const categoriasRenderizadasAtual = new Set();
    const botoesCategorias = categoriasList.querySelectorAll('.categoria-btn');
    
    botoesCategorias.forEach(botao => {
        if (botao.dataset.categoria && botao.dataset.categoria !== 'todos') {
            categoriasRenderizadasAtual.add(botao.dataset.categoria);
        }
    });
    
    // Verificar se há novas categorias
    const todasCategorias = Array.from(categorias);
    const novasCategorias = todasCategorias.filter(cat => 
        cat !== 'todos' && !categoriasRenderizadasAtual.has(cat)
    );
    
    // Se houver novas categorias, adicionar apenas elas
    if (novasCategorias.length > 0) {
        console.log('Novas categorias detectadas, atualizando...', novasCategorias);
        novasCategorias.forEach(categoria => {
            const btn = document.createElement('button');
            btn.className = 'categoria-btn';
            btn.dataset.categoria = categoria;
            
            let icon = 'fa-utensils';
            if (categoria === 'bebida' || categoria === 'bebidas') icon = 'fa-glass-martini-alt';
            if (categoria === 'sobremesa' || categoria === 'sobremesas') icon = 'fa-ice-cream';
            if (categoria === 'lanche' || categoria === 'lanches') icon = 'fa-hamburger';
            if (categoria === 'comida') icon = 'fa-utensil-spoon';
            
            btn.innerHTML = `<i class="fas ${icon}"></i> ${formatarNomeCategoria(categoria)}`;
            btn.addEventListener('click', () => filtrarPorCategoria(categoria));
            categoriasList.appendChild(btn);
        });
    }
}

// Formatar nome da categoria para exibição
function formatarNomeCategoria(categoria) {
    const nomes = {
        'todos': 'Todos',
        'bebida': 'Bebidas',
        'bebidas': 'Bebidas',
        'comida': 'Comidas',
        'lanche': 'Lanches',
        'lanches': 'Lanches',
        'sobremesa': 'Sobremesas',
        'sobremesas': 'Sobremesas',
        'outro': 'Outros',
        'outros': 'Outros'
    };
    
    return nomes[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
    console.log(`Filtrando por categoria: ${categoria}`);
    
    // Ativar o botão correto
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.categoria === categoria) {
            btn.classList.add('active');
            console.log(`Botão ${categoria} ativado`);
        }
    });
    
    const filtrados = categoria === 'todos' ? produtos : produtos.filter(p => p.categoria === categoria);
    console.log(`Mostrando ${filtrados.length} produtos para categoria ${categoria}`);
    renderizarProdutos(filtrados);
}

// Filtrar produtos
function filtrarProdutos() {
    if (!searchProdutos) return;
    
    const termo = searchProdutos.value.toLowerCase().trim();
    
    if (!termo) {
        const categoriaAtiva = document.querySelector('.categoria-btn.active')?.dataset.categoria || 'todos';
        filtrarPorCategoria(categoriaAtiva);
        return;
    }
    
    const filtrados = produtos.filter(produto => 
        produto.nome.toLowerCase().includes(termo) || 
        produto.descricao.toLowerCase().includes(termo)
    );
    
    renderizarProdutos(filtrados);
}

// Adicionar ao carrinho
function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const estoqueDisponivel = produto.quantidade || 0;
    if (estoqueDisponivel <= 0) {
        mostrarNotificacao('Produto esgotado', 'error');
        return;
    }
    
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        if (itemExistente.quantidade + 1 > estoqueDisponivel) {
            mostrarNotificacao('Estoque insuficiente', 'error');
            return;
        }
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            id: produtoId,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1,
            imagemURL: produto.imagemURL,
            maxQuantidade: estoqueDisponivel
        });
    }
    
    salvarCarrinho();
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado`, 'success');
    
    if (!carrinhoAberto) abrirCarrinho();
}

// Atualizar carrinho
function atualizarCarrinho() {
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    const totalValor = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    if (carrinhoCount) carrinhoCount.textContent = totalItens;
    if (carrinhoTotal) {
        carrinhoTotal.textContent = totalValor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }
    
    atualizarModalCarrinho();
}

// Atualizar modal do carrinho
function atualizarModalCarrinho() {
    if (!carrinhoEmpty || !carrinhoItems) return;
    
    if (carrinho.length === 0) {
        carrinhoEmpty.style.display = 'block';
        carrinhoItems.style.display = 'none';
    } else {
        carrinhoEmpty.style.display = 'none';
        carrinhoItems.style.display = 'flex';
        
        carrinhoItems.innerHTML = '';
        let subtotalValor = 0;
        
        carrinho.forEach((item, index) => {
            const itemTotal = item.preco * item.quantidade;
            subtotalValor += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'carrinho-item';
            itemElement.innerHTML = `
                <div class="carrinho-item-image">
                    ${item.imagemURL ? 
                        `<img src="${item.imagemURL}" alt="${item.nome}">` : 
                        `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666;">
                            <i class="fas fa-image"></i>
                        </div>`
                    }
                </div>
                <div class="carrinho-item-info">
                    <div class="carrinho-item-name">${item.nome}</div>
                    <div class="carrinho-item-price">
                        ${item.preco.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                    </div>
                    <div class="carrinho-item-controls">
                        <button class="quantity-btn" onclick="alterarQuantidade(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-value">${item.quantidade}</span>
                        <button class="quantity-btn" onclick="alterarQuantidade(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item" onclick="removerDoCarrinho(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            carrinhoItems.appendChild(itemElement);
        });
        
        const taxaEntrega = 5.00;
        const total = subtotalValor + taxaEntrega;
        
        if (subtotal) subtotal.textContent = subtotalValor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        if (totalCarrinho) totalCarrinho.textContent = total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    }
}

// Alterar quantidade
function alterarQuantidade(index, delta) {
    const item = carrinho[index];
    if (!item) return;
    
    const novaQuantidade = item.quantidade + delta;
    
    if (novaQuantidade < 1) {
        removerDoCarrinho(index);
        return;
    }
    
    const produtoAtual = produtos.find(p => p.id === item.id);
    const estoqueAtual = produtoAtual ? (produtoAtual.quantidade || 0) : 0;
    
    if (novaQuantidade > estoqueAtual) {
        mostrarNotificacao('Quantidade máxima disponível', 'error');
        return;
    }
    
    item.quantidade = novaQuantidade;
    item.maxQuantidade = estoqueAtual;
    salvarCarrinho();
    atualizarCarrinho();
}

// Remover do carrinho
function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    atualizarCarrinho();
    mostrarNotificacao('Item removido', 'info');
}

// Limpar carrinho
function limparCarrinho() {
    if (carrinho.length === 0) return;
    
    if (confirm('Limpar carrinho?')) {
        carrinho = [];
        salvarCarrinho();
        atualizarCarrinho();
        mostrarNotificacao('Carrinho limpo', 'info');
    }
}

// Gerar ID único para o pedido
function gerarIdPedido() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PED${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

// Função para finalizar pedido (SALVA NO FIREBASE COMO PENDENTE)
async function finalizarPedido() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Carrinho vazio', 'error');
        return;
    }
    
    // Verificar se todos os itens ainda têm estoque
    for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.id);
        if (!produto || produto.quantidade < item.quantidade) {
            mostrarNotificacao(`${item.nome} sem estoque suficiente!`, 'error');
            return;
        }
    }
    
    // Gerar ID do pedido
    const idPedido = gerarIdPedido();
    const dataAtual = new Date().toISOString().split('T')[0];
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Calcular total
    const subtotalValor = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    const taxaEntrega = 5.00;
    const total = subtotalValor + taxaEntrega;
    
    try {
        const db = firebase.firestore();
        
        // Criar objeto do pedido - STATUS COMO "pendente"
        const pedido = {
            idPedido: idPedido,
            itens: carrinho.map(item => ({
                produtoId: item.id,
                nome: item.nome,
                preco: item.preco,
                quantidade: item.quantidade,
                totalItem: item.preco * item.quantidade
            })),
            subtotal: subtotalValor,
            taxaEntrega: taxaEntrega,
            total: total,
            data: dataAtual,
            hora: horaAtual,
            status: 'pendente', // Status inicial como pendente
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firebase na coleção 'pedidos'
        await db.collection('pedidos').doc(idPedido).set(pedido);
        console.log(`✅ Pedido ${idPedido} salvo como pendente no Firebase`);
        
        // Atualizar estoque dos produtos
        const batch = db.batch();
        
        for (const item of carrinho) {
            const produtoRef = db.collection('produtos').doc(item.id);
            batch.update(produtoRef, {
                quantidade: firebase.firestore.FieldValue.increment(-item.quantidade),
                quantidadeEstoque: firebase.firestore.FieldValue.increment(-item.quantidade)
            });
        }
        
        await batch.commit();
        console.log(`✅ Estoque atualizado para o pedido ${idPedido}`);
        
        // Limpar carrinho local
        carrinho = [];
        salvarCarrinho();
        atualizarCarrinho();
        fecharCarrinho();
        
        // Mostrar confirmação
        mostrarNotificacao(`Pedido ${idPedido} enviado para área de pendentes!`, 'success', 5000);
        
        // Mostrar resumo do pedido
        alert(`✅ Pedido realizado com sucesso!\n\n📋 ID do Pedido: ${idPedido}\n💰 Total: R$ ${total.toFixed(2)}\n📅 Data: ${dataAtual}\n⏰ Hora: ${horaAtual}\n\nSeu pedido foi enviado para preparo e aparecerá na aba de pendentes!`);
        
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        mostrarNotificacao('Erro ao finalizar pedido', 'error');
        alert('❌ Ocorreu um erro ao finalizar o pedido. Tente novamente.');
    }
}

// Ver detalhes do produto
function verDetalhesProduto(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const temEstoque = produto.quantidade > 0;
    const precoFormatado = produto.preco.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    
    produtoModalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="height: 180px; width: 100%; border-radius: 8px; overflow: hidden; margin-bottom: 16px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0);">
                ${produto.imagemURL ? 
                    `<img src="${produto.imagemURL}" alt="${produto.nome}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b;">
                        <i class="fas fa-image" style="font-size: 2.5rem;"></i>
                    </div>`
                }
            </div>
            <span style="display: inline-block; background: ${temEstoque ? '#10b981' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                ${temEstoque ? 'Disponível' : 'Esgotado'}
            </span>
        </div>
        
        <h2 style="font-size: 1.4rem; margin-bottom: 8px; color: #1e293b;">${produto.nome}</h2>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span style="color: #2563eb; font-size: 1.5rem; font-weight: 700;">${precoFormatado}</span>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 1rem; margin-bottom: 8px; color: #1e293b;">Descrição</h3>
            <p style="color: #64748b; line-height: 1.5;">${produto.descricao || 'Sem descrição'}</p>
        </div>
        
        <button class="btn-add-cart" onclick="adicionarAoCarrinho('${produto.id}'); fecharModalProduto();" style="width: 100%; padding: 12px; font-size: 1rem;" ${!temEstoque ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <i class="fas fa-cart-plus"></i>
            ${temEstoque ? 'Adicionar ao Carrinho' : 'Esgotado'}
        </button>
    `;
    
    produtoModal.classList.add('active');
}

// Abrir carrinho
function abrirCarrinho() {
    if (carrinhoModal) carrinhoModal.classList.add('active');
    carrinhoAberto = true;
}

// Fechar carrinho
function fecharCarrinho() {
    if (carrinhoModal) carrinhoModal.classList.remove('active');
    carrinhoAberto = false;
}

// Fechar modal do produto
function fecharModalProduto() {
    if (produtoModal) produtoModal.classList.remove('active');
}

// Salvar carrinho
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo, duracao = 3000) {
    const existente = document.querySelector('.notification');
    if (existente) existente.remove();
    
    const notificacao = document.createElement('div');
    notificacao.className = `notification ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        if (notificacao.parentElement) notificacao.remove();
    }, duracao);
}

// Exportar funções para o escopo global
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.verDetalhesProduto = verDetalhesProduto;
window.alterarQuantidade = alterarQuantidade;
window.removerDoCarrinho = removerDoCarrinho;
window.filtrarPorCategoria = filtrarPorCategoria;