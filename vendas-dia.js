// Vendas do Dia - Integrado com Firebase e listener em tempo real

// Dados
let vendasFinalizadas = [];
let vendasPendentes = [];
let vendasCanceladas = [];

// Referência do listener
let pedidosListener = null;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Atualizar data e hora
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);
    
    // Configurar data do filtro para hoje
    document.getElementById('dataFiltro').value = getDataAtual();
    
    // Inicializar Firebase e carregar dados
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        configurarListenerTempoReal();
    } else {
        console.error("Firebase não inicializado!");
        carregarDadosExemplo();
    }
    
    // Configurar eventos
    configurarEventos();
});

// Configurar listener em tempo real
function configurarListenerTempoReal() {
    const db = firebase.firestore();
    const dataFiltro = document.getElementById('dataFiltro').value;
    
    // Cancelar listener anterior se existir
    if (pedidosListener) {
        pedidosListener();
    }
    
    // Configurar listener em tempo real para pedidos da data selecionada
    pedidosListener = db.collection('pedidos')
        .where('data', '==', dataFiltro)
        .onSnapshot((querySnapshot) => {
            console.log('📡 Atualização em tempo real recebida!');
            
            // Resetar arrays
            vendasFinalizadas = [];
            vendasPendentes = [];
            vendasCanceladas = [];
            
            if (querySnapshot.empty) {
                console.log('Nenhum pedido encontrado para esta data');
            } else {
                querySnapshot.forEach((doc) => {
                    const pedido = {
                        id: doc.id,
                        ...doc.data()
                    };
                    
                    // Separar por status
                    if (pedido.status === 'finalizada') {
                        vendasFinalizadas.push(pedido);
                    } else if (pedido.status === 'pendente') {
                        vendasPendentes.push(pedido);
                    } else if (pedido.status === 'cancelada') {
                        vendasCanceladas.push(pedido);
                    }
                });
            }
            
            // Atualizar as tabelas
            atualizarTabelas();
            atualizarContadores();
            atualizarResumoVendas();
            
            // Mostrar notificação se houver novo pedido pendente
            verificarNovosPedidos();
        }, (error) => {
            console.error('Erro no listener:', error);
            mostrarNotificacao('Erro na conexão com o servidor', 'error');
        });
}

// Verificar se há novos pedidos pendentes
function verificarNovosPedidos() {
    // Esta função pode ser expandida para notificações mais avançadas
    if (vendasPendentes.length > 0) {
        // Atualizar título da aba com destaque
        const pendentesBtn = document.querySelector('[data-aba="pendentes"]');
        const contador = pendentesBtn.querySelector('.aba-contador');
        
        // Adicionar animação se o contador mudou
        if (contador.textContent !== vendasPendentes.length.toString()) {
            contador.classList.add('pulse');
            setTimeout(() => contador.classList.remove('pulse'), 1000);
        }
        
        // Se a aba não está ativa, mostrar notificação
        const abaAtiva = document.querySelector('.aba-conteudo.active').id;
        if (abaAtiva !== 'aba-pendentes' && vendasPendentes.length > 0) {
            mostrarNotificacaoPedido(`${vendasPendentes.length} novo(s) pedido(s) pendente(s)!`, 'warning');
        }
    }
}

// Notificação especial para novos pedidos
function mostrarNotificacaoPedido(mensagem, tipo) {
    // Verificar se já existe uma notificação
    const notificacaoExistente = document.querySelector('.notificacao-pedido');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-pedido ${tipo}`;
    notificacao.innerHTML = `
        <div class="notificacao-conteudo">
            <i class="fas fa-bell"></i>
            <div>
                <strong>Novo Pedido!</strong>
                <span>${mensagem}</span>
            </div>
            <button class="notificacao-fechar" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <button class="notificacao-acao" onclick="abrirAbaPendentes()">
            <i class="fas fa-eye"></i> Ver Pedidos
        </button>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover automaticamente após 10 segundos
    setTimeout(() => {
        if (notificacao.parentElement) {
            notificacao.remove();
        }
    }, 5000);
}

// Abrir aba de pendentes
function abrirAbaPendentes() {
    // Ativar aba pendentes
    document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-aba="pendentes"]').classList.add('active');
    
    // Mostrar conteúdo
    document.querySelectorAll('.aba-conteudo').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('aba-pendentes').classList.add('active');
    
    // Remover notificação
    const notificacao = document.querySelector('.notificacao-pedido');
    if (notificacao) notificacao.remove();
}

// Atualizar data e hora
function atualizarDataHora() {
    const agora = new Date();
    
    // Formatar data
    const dataFormatada = agora.toLocaleDateString('pt-BR', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    document.getElementById('currentDate').textContent = dataFormatada;
    
    // Formatar hora
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.getElementById('currentTime').textContent = horaFormatada;
    
    // Verificar se mudou o dia para atualizar o filtro
    const dataAtual = getDataAtual();
    const filtroData = document.getElementById('dataFiltro').value;
    
    if (dataAtual !== filtroData && filtroData === getDataAtual()) {
        // Se o usuário está vendo "hoje" e o dia mudou, atualizar automaticamente
        document.getElementById('dataFiltro').value = dataAtual;
        configurarListenerTempoReal();
    }
}

// Obter data atual
function getDataAtual() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Configurar eventos
function configurarEventos() {
    // Navegação entre abas
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const abaId = this.getAttribute('data-aba');
            
            // Ativar aba clicada
            document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar conteúdo da aba
            document.querySelectorAll('.aba-conteudo').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`aba-${abaId}`).classList.add('active');
        });
    });
    
    // Filtro por data
    document.getElementById('btnFiltrar').addEventListener('click', function() {
        const dataFiltro = document.getElementById('dataFiltro').value;
        const categoriaFiltro = document.getElementById('categoriaFiltro').value;
        
        // Atualizar listener com nova data
        configurarListenerTempoReal();
    });
    
    // Botão "Hoje"
    document.getElementById('btnHoje').addEventListener('click', function() {
        document.getElementById('dataFiltro').value = getDataAtual();
        document.getElementById('categoriaFiltro').value = 'todos';
        configurarListenerTempoReal();
    });
    
    // Busca nas tabelas
    document.getElementById('searchProdutos').addEventListener('input', function(e) {
        filtrarTabela('finalizadas', e.target.value);
    });
    
    document.getElementById('searchPendentes').addEventListener('input', function(e) {
        filtrarTabela('pendentes', e.target.value);
    });
    
    document.getElementById('searchCanceladas').addEventListener('input', function(e) {
        filtrarTabela('canceladas', e.target.value);
    });
    
    // Exportar dados
    document.getElementById('btnExportarFinalizadas').addEventListener('click', function() {
        exportarDados('finalizadas');
    });
    
    document.getElementById('btnExportarCanceladas').addEventListener('click', function() {
        exportarDados('canceladas');
    });
    
    // Finalizar todos pendentes
    document.getElementById('btnFinalizarTodos').addEventListener('click', finalizarTodosPendentes);
    
    // Voltar ao Dashboard
    document.getElementById('btnVoltarDashboard').addEventListener('click', function() {
        // Cancelar listener ao sair da página
        if (pedidosListener) {
            pedidosListener();
        }
        window.location.href = 'dashboard.html';
    });
    
    // Atualizar listener quando a página ganha foco
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && typeof firebase !== 'undefined') {
            // Página ficou visível novamente, recarregar dados
            configurarListenerTempoReal();
        }
    });
}

// Carregar dados de exemplo (fallback)
function carregarDadosExemplo() {
    const dataAtual = getDataAtual();
    
    // Dados de exemplo
    vendasFinalizadas = [
        { 
            id: "PED123456", 
            idPedido: "PED123456", 
            itens: [{ nome: "Hambúrguer Clássico", quantidade: 2, preco: 25.90 }],
            subtotal: 51.80,
            taxaEntrega: 5.00,
            total: 56.80,
            data: dataAtual,
            hora: "12:30",
            status: "finalizada"
        }
    ];
    
    vendasPendentes = [
        { 
            id: "PED789012", 
            idPedido: "PED789012", 
            itens: [{ nome: "Pizza Margherita", quantidade: 1, preco: 38.90 }],
            subtotal: 38.90,
            taxaEntrega: 5.00,
            total: 43.90,
            data: dataAtual,
            hora: "19:30",
            status: "pendente"
        }
    ];
    
    vendasCanceladas = [];
    
    atualizarTabelas();
    atualizarContadores();
    atualizarResumoVendas();
}

// Mostrar loading nas tabelas
function mostrarLoadingTabelas() {
    document.getElementById('tabelaFinalizadasBody').innerHTML = `
        <tr class="loading-row">
            <td colspan="6">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando...</span>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('tabelaPendentesBody').innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando...</span>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('tabelaCanceladasBody').innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando...</span>
                </div>
            </td>
        </tr>
    `;
}

// Atualizar todas as tabelas
function atualizarTabelas() {
    atualizarTabelaVendas('finalizadas', vendasFinalizadas);
    atualizarTabelaVendas('pendentes', vendasPendentes);
    atualizarTabelaVendas('canceladas', vendasCanceladas);
}

// Atualizar tabela específica
function atualizarTabelaVendas(tipo, vendas) {
    const tbody = document.getElementById(`tabela${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Body`);
    const totalElement = document.getElementById(`total${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    
    if (vendas.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="${tipo === 'pendentes' ? 7 : tipo === 'canceladas' ? 7 : 6}">
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <h4>Sem vendas ${tipo}</h4>
                        <p>Nenhuma venda ${tipo} encontrada</p>
                    </div>
                </td>
            </tr>
        `;
        if (totalElement) totalElement.textContent = '0';
        return;
    }
    
    let html = '';
    
    if (tipo === 'finalizadas') {
        vendas.forEach(pedido => {
            // Para cada item no pedido, criar uma linha
            pedido.itens.forEach((item, index) => {
                const isFirstItem = index === 0;
                html += `
                    <tr>
                        <td>${isFirstItem ? `<strong>#${pedido.idPedido}</strong>` : ''}</td>
                        <td><strong>${item.nome}</strong></td>
                        <td>${item.quantidade}</td>
                        <td>${formatarMoeda(item.preco)}</td>
                        <td>${formatarMoeda(item.preco * item.quantidade)}</td>
                        <td>${isFirstItem ? pedido.hora : ''}</td>
                    </tr>
                `;
            });
        });
    } else if (tipo === 'pendentes') {
        vendas.forEach(pedido => {
            pedido.itens.forEach((item, index) => {
                const isFirstItem = index === 0;
                html += `
                    <tr data-id="${pedido.id}" class="pedido-pendente">
                        <td>${isFirstItem ? `<strong>#${pedido.idPedido}</strong>` : ''}</td>
                        <td><strong>${item.nome}</strong></td>
                        <td>${item.quantidade}</td>
                        <td>${formatarMoeda(item.preco)}</td>
                        <td>${formatarMoeda(item.preco * item.quantidade)}</td>
                        <td>${isFirstItem ? pedido.hora : ''}</td>
                        <td>
                            ${isFirstItem ? `
                                <button class="btn-acao btn-finalizar" onclick="finalizarVenda('${pedido.id}')">
                                    <i class="fas fa-check"></i> Finalizar
                                </button>
                                <button class="btn-acao btn-cancelar" onclick="cancelarVenda('${pedido.id}')">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
        });
    } else if (tipo === 'canceladas') {
        vendas.forEach(pedido => {
            pedido.itens.forEach((item, index) => {
                const isFirstItem = index === 0;
                html += `
                    <tr>
                        <td>${isFirstItem ? `<strong>#${pedido.idPedido}</strong>` : ''}</td>
                        <td><strong>${item.nome}</strong></td>
                        <td>${item.quantidade}</td>
                        <td>${formatarMoeda(item.preco)}</td>
                        <td>${formatarMoeda(item.preco * item.quantidade)}</td>
                        <td>${isFirstItem ? pedido.hora : ''}</td>
                        <td><span class="motivo-badge">${pedido.motivoCancelamento || 'Não informado'}</span></td>
                    </tr>
                `;
            });
        });
    }
    
    tbody.innerHTML = html;
    if (totalElement) totalElement.textContent = vendas.length;
}

// Atualizar contadores das abas
function atualizarContadores() {
    document.getElementById('contadorFinalizadas').textContent = vendasFinalizadas.length;
    document.getElementById('contadorPendentes').textContent = vendasPendentes.length;
    document.getElementById('contadorCanceladas').textContent = vendasCanceladas.length;
}

// Atualizar resumo de vendas
function atualizarResumoVendas() {
    if (vendasFinalizadas.length === 0) {
        document.getElementById('totalVendas').textContent = 'R$ 0,00';
        document.getElementById('quantidadeVendas').textContent = '0 vendas';
        document.getElementById('totalProdutos').textContent = '0';
        document.getElementById('produtosDiferentes').textContent = 'unidades';
        document.getElementById('ticketMedio').textContent = 'R$ 0,00';
        document.getElementById('melhorProduto').textContent = '-';
        document.getElementById('melhorProdutoQuantidade').textContent = '0 un';
        return;
    }
    
    // Calcular totais
    const totalVendas = vendasFinalizadas.reduce((soma, pedido) => soma + pedido.total, 0);
    const quantidadeVendas = vendasFinalizadas.length;
    
    // Total de produtos vendidos
    let totalProdutos = 0;
    const produtosVendidos = {};
    
    vendasFinalizadas.forEach(pedido => {
        pedido.itens.forEach(item => {
            totalProdutos += item.quantidade;
            produtosVendidos[item.nome] = (produtosVendidos[item.nome] || 0) + item.quantidade;
        });
    });
    
    // Produtos diferentes
    const produtosUnicos = Object.keys(produtosVendidos);
    
    // Ticket médio
    const ticketMedio = totalVendas / quantidadeVendas;
    
    // Produto mais vendido
    let melhorProduto = '';
    let melhorProdutoQuantidade = 0;
    
    for (const [produto, quantidade] of Object.entries(produtosVendidos)) {
        if (quantidade > melhorProdutoQuantidade) {
            melhorProduto = produto;
            melhorProdutoQuantidade = quantidade;
        }
    }
    
    // Atualizar interface
    document.getElementById('totalVendas').textContent = formatarMoeda(totalVendas);
    document.getElementById('quantidadeVendas').textContent = `${quantidadeVendas} venda${quantidadeVendas !== 1 ? 's' : ''}`;
    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('produtosDiferentes').textContent = `${produtosUnicos.length} tipo${produtosUnicos.length !== 1 ? 's' : ''}`;
    document.getElementById('ticketMedio').textContent = formatarMoeda(ticketMedio);
    document.getElementById('melhorProduto').textContent = melhorProduto.substring(0, 15) + (melhorProduto.length > 15 ? '...' : '');
    document.getElementById('melhorProdutoQuantidade').textContent = `${melhorProdutoQuantidade} un`;
}

// Filtrar tabela
function filtrarTabela(tipo, texto) {
    const tabelaId = tipo === 'finalizadas' ? 'tabelaFinalizadas' : 
                    tipo === 'pendentes' ? 'tabelaPendentes' : 'tabelaCanceladas';
    const linhas = document.querySelectorAll(`#${tabelaId} tbody tr`);
    const textoBusca = texto.toLowerCase().trim();
    
    linhas.forEach(linha => {
        if (linha.classList.contains('empty-row') || linha.classList.contains('loading-row')) {
            return;
        }
        
        const textoLinha = linha.textContent.toLowerCase();
        if (textoBusca === '' || textoLinha.includes(textoBusca)) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}

// Finalizar venda pendente (Firebase)
async function finalizarVenda(pedidoId) {
    if (confirm('Deseja finalizar este pedido?')) {
        try {
            const db = firebase.firestore();
            
            // Atualizar status no Firebase
            await db.collection('pedidos').doc(pedidoId).update({
                status: 'finalizada',
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // O listener em tempo real vai atualizar automaticamente
            mostrarNotificacao('Pedido finalizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            mostrarNotificacao('Erro ao finalizar pedido', 'error');
        }
    }
}

// Cancelar venda pendente (Firebase)
async function cancelarVenda(pedidoId) {
    const motivo = prompt('Informe o motivo do cancelamento:');
    if (motivo !== null && motivo.trim() !== '') {
        try {
            const db = firebase.firestore();
            
            // Atualizar status no Firebase
            await db.collection('pedidos').doc(pedidoId).update({
                status: 'cancelada',
                motivoCancelamento: motivo.trim(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // O listener em tempo real vai atualizar automaticamente
            mostrarNotificacao('Pedido cancelado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            mostrarNotificacao('Erro ao cancelar pedido', 'error');
        }
    }
}

// Finalizar todos os pendentes
async function finalizarTodosPendentes() {
    if (vendasPendentes.length === 0) {
        alert('Não há pedidos pendentes para finalizar!');
        return;
    }
    
    if (confirm(`Deseja finalizar todos os ${vendasPendentes.length} pedidos pendentes?`)) {
        try {
            const db = firebase.firestore();
            const batch = db.batch();
            
            // Atualizar todos os pedidos pendentes
            vendasPendentes.forEach(pedido => {
                const pedidoRef = db.collection('pedidos').doc(pedido.id);
                batch.update(pedidoRef, {
                    status: 'finalizada',
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            // Executar batch update
            await batch.commit();
            
            // O listener em tempo real vai atualizar automaticamente
            mostrarNotificacao('Todos os pedidos foram finalizados!', 'success');
        } catch (error) {
            console.error('Erro ao finalizar todos os pedidos:', error);
            mostrarNotificacao('Erro ao finalizar pedidos', 'error');
        }
    }
}

// Exportar dados para CSV
function exportarDados(tipo) {
    let dados;
    let nomeArquivo;
    
    if (tipo === 'finalizadas') {
        dados = vendasFinalizadas;
        nomeArquivo = 'vendas_finalizadas';
    } else {
        dados = vendasCanceladas;
        nomeArquivo = 'vendas_canceladas';
    }
    
    if (dados.length === 0) {
        alert(`Não há dados de ${tipo} para exportar!`);
        return;
    }
    
    // Criar CSV
    let csv = 'ID Pedido,Produto,Quantidade,Valor Unitário,Total,Data,Hora,Status';
    if (tipo === 'canceladas') {
        csv += ',Motivo\n';
    } else {
        csv += '\n';
    }
    
    dados.forEach(pedido => {
        pedido.itens.forEach((item, index) => {
            const linha = [
                index === 0 ? pedido.idPedido : '',
                item.nome,
                item.quantidade,
                item.preco.toFixed(2),
                (item.preco * item.quantidade).toFixed(2),
                pedido.data,
                index === 0 ? pedido.hora : '',
                pedido.status
            ];
            
            if (tipo === 'canceladas') {
                linha.push(pedido.motivoCancelamento || '');
            }
            
            csv += linha.join(',') + '\n';
        });
    });
    
    // Criar e baixar arquivo
    const dataAtual = getDataAtual();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}_${dataAtual}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Exportado: ${dados.length} ${tipo}`);
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-flutuante ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.remove();
    }, 3000);
}

// Funções auxiliares
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(valor);
}

// Função para migrar pedidos antigos (usar apenas uma vez)
async function migrarPedidosAntigos() {
    try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('pedidos').get();
        
        const batch = db.batch();
        let atualizados = 0;
        
        querySnapshot.forEach((doc) => {
            const pedido = doc.data();
            
            // Se o pedido não tem status ou tem status diferente dos atuais
            if (!pedido.status || !['finalizada', 'pendente', 'cancelada'].includes(pedido.status)) {
                // Padronizar para 'finalizada' se for antigo
                batch.update(doc.ref, {
                    status: 'finalizada',
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                atualizados++;
            }
        });
        
        if (atualizados > 0) {
            await batch.commit();
            alert(`${atualizados} pedidos foram atualizados para status 'finalizada'`);
            configurarListenerTempoReal();
        } else {
            alert('Nenhum pedido precisou ser atualizado');
        }
    } catch (error) {
        console.error('Erro na migração:', error);
        alert('Erro ao migrar pedidos');
    }
}