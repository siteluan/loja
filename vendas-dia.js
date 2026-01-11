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
        mostrarNotificacao('Erro ao conectar com o servidor', 'error');
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
    
    console.log(`🔍 Monitorando pedidos da data: ${dataFiltro}`);
    
    // Mostrar loading
    mostrarLoadingTabelas();
    
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
                console.log(`📊 ${querySnapshot.size} pedidos encontrados`);
                querySnapshot.forEach((doc) => {
                    const pedido = {
                        id: doc.id,
                        ...doc.data()
                    };
                    
                    // Verificar se pedido tem dados básicos
                    if (!pedido.idPedido) pedido.idPedido = doc.id;
                    if (!pedido.data) pedido.data = dataFiltro;
                    if (!pedido.hora) pedido.hora = '--:--';
                    
                    // Separar por status
                    if (pedido.status === 'finalizada') {
                        vendasFinalizadas.push(pedido);
                    } else if (pedido.status === 'pendente') {
                        vendasPendentes.push(pedido);
                    } else if (pedido.status === 'cancelada') {
                        vendasCanceladas.push(pedido);
                    } else {
                        // Status desconhecido, considerar como pendente
                        pedido.status = 'pendente';
                        vendasPendentes.push(pedido);
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
            
            // Mostrar estado de erro
            mostrarErroTabelas('Erro ao carregar dados do servidor');
        });
}

// Verificar se há novos pedidos pendentes
function verificarNovosPedidos() {
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
        const novaNotificacao = vendasPendentes.filter(p => {
            // Verificar se o pedido é recente (últimos 5 minutos)
            if (p.criadoEm) {
                const criado = p.criadoEm.toDate ? p.criadoEm.toDate() : new Date();
                const agora = new Date();
                const diferencaMin = (agora - criado) / (1000 * 60);
                return diferencaMin < 5;
            }
            return true;
        }).length;
        
        if (novaNotificacao > 0) {
            mostrarNotificacaoPedido(`${novaNotificacao} novo(s) pedido(s) pendente(s)!`, 'warning');
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
    }, 10000);
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
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('currentDate').textContent = dataFormatada;
    
    // Formatar hora
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.getElementById('currentTime').textContent = horaFormatada;
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

// Mostrar loading nas tabelas
function mostrarLoadingTabelas() {
    document.getElementById('tabelaFinalizadasBody').innerHTML = `
        <tr class="loading-row">
            <td colspan="6">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando vendas finalizadas...</span>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('tabelaPendentesBody').innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando vendas pendentes...</span>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('tabelaCanceladasBody').innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando vendas canceladas...</span>
                </div>
            </td>
        </tr>
    `;
}

// Mostrar erro nas tabelas
function mostrarErroTabelas(mensagem) {
    document.getElementById('tabelaFinalizadasBody').innerHTML = `
        <tr class="error-row">
            <td colspan="6">
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${mensagem}</span>
                    <button onclick="configurarListenerTempoReal()" class="btn-reload">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('tabelaPendentesBody').innerHTML = `
        <tr class="error-row">
            <td colspan="7">
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${mensagem}</span>
                    <button onclick="configurarListenerTempoReal()" class="btn-reload">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('tabelaCanceladasBody').innerHTML = `
        <tr class="error-row">
            <td colspan="7">
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${mensagem}</span>
                    <button onclick="configurarListenerTempoReal()" class="btn-reload">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
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
                        <i class="fas fa-${tipo === 'finalizadas' ? 'check-circle' : tipo === 'pendentes' ? 'clock' : 'times-circle'}"></i>
                        <h4>Sem vendas ${tipo}</h4>
                        <p>Nenhuma venda ${tipo} encontrada para esta data</p>
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
                        <td>${isFirstItem ? `<strong class="pedido-id">#${pedido.idPedido}</strong>` : ''}</td>
                        <td><strong>${item.nome}</strong></td>
                        <td><span class="quantidade-badge">${item.quantidade}x</span></td>
                        <td>${formatarMoeda(item.preco)}</td>
                        <td><strong>${formatarMoeda(item.totalItem || item.preco * item.quantidade)}</strong></td>
                        <td>${isFirstItem ? `<span class="hora-pedido">${pedido.hora}</span>` : ''}</td>
                    </tr>
                `;
            });
        });
    } else if (tipo === 'pendentes') {
        vendas.forEach(pedido => {
            pedido.itens.forEach((item, index) => {
                const isFirstItem = index === 0;
                const horaPedido = pedido.criadoEm ? 
                    new Date(pedido.criadoEm.seconds * 1000).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                    pedido.hora;
                
                html += `
                    <tr data-id="${pedido.id}" class="pedido-pendente ${isFirstItem ? 'first-item' : ''}">
                        <td>${isFirstItem ? `<strong class="pedido-id">#${pedido.idPedido}</strong>` : ''}</td>
                        <td><strong>${item.nome}</strong></td>
                        <td><span class="quantidade-badge">${item.quantidade}x</span></td>
                        <td>${formatarMoeda(item.preco)}</td>
                        <td><strong>${formatarMoeda(item.totalItem || item.preco * item.quantidade)}</strong></td>
                        <td>${isFirstItem ? `<span class="hora-pedido">${horaPedido}</span>` : ''}</td>
                        <td>
                            ${isFirstItem ? `
                                <div class="acoes-pedido">
                                    <button class="btn-acao btn-finalizar" onclick="finalizarVenda('${pedido.id}', '${pedido.idPedido}')" title="Finalizar Pedido">
                                        <i class="fas fa-check"></i> Finalizar
                                    </button>
                                    <button class="btn-acao btn-cancelar" onclick="cancelarVenda('${pedido.id}', '${pedido.idPedido}')" title="Cancelar Pedido">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                </div>
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
                const motivo = pedido.motivoCancelamento || 'Cliente solicitou';
                
                html += `
                    <tr>
                        <td>${isFirstItem ? `<strong class="pedido-id">#${pedido.idPedido}</strong>` : ''}</td>
                        <td><strong>${item.nome}</strong></td>
                        <td><span class="quantidade-badge">${item.quantidade}x</span></td>
                        <td>${formatarMoeda(item.preco)}</td>
                        <td>${formatarMoeda(item.totalItem || item.preco * item.quantidade)}</td>
                        <td>${isFirstItem ? `<span class="hora-pedido">${pedido.hora}</span>` : ''}</td>
                        <td><span class="motivo-badge" title="${motivo}">${motivo.length > 20 ? motivo.substring(0, 20) + '...' : motivo}</span></td>
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
    
    // Destacar se houver pendentes
    const pendentesContador = document.getElementById('contadorPendentes');
    if (vendasPendentes.length > 0) {
        pendentesContador.classList.add('has-pending');
    } else {
        pendentesContador.classList.remove('has-pending');
    }
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
        if (linha.classList.contains('empty-row') || linha.classList.contains('loading-row') || linha.classList.contains('error-row')) {
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
async function finalizarVenda(pedidoId, idPedido) {
    if (confirm(`Deseja finalizar o pedido #${idPedido}?`)) {
        try {
            const db = firebase.firestore();
            
            // Atualizar status no Firebase
            await db.collection('pedidos').doc(pedidoId).update({
                status: 'finalizada',
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarNotificacao(`Pedido #${idPedido} finalizado com sucesso!`, 'success');
            
            // O listener em tempo real vai atualizar automaticamente
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            mostrarNotificacao('Erro ao finalizar pedido', 'error');
        }
    }
}

// Cancelar venda pendente (Firebase)
async function cancelarVenda(pedidoId, idPedido) {
    const motivo = prompt(`Informe o motivo do cancelamento do pedido #${idPedido}:`, 'Cliente solicitou');
    if (motivo !== null && motivo.trim() !== '') {
        try {
            const db = firebase.firestore();
            
            // Primeiro, reestocar os produtos
            const pedidoDoc = await db.collection('pedidos').doc(pedidoId).get();
            const pedido = pedidoDoc.data();
            
            if (pedido && pedido.itens) {
                const batch = db.batch();
                
                // Reestocar cada item
                for (const item of pedido.itens) {
                    const produtoRef = db.collection('produtos').doc(item.produtoId);
                    batch.update(produtoRef, {
                        quantidade: firebase.firestore.FieldValue.increment(item.quantidade),
                        quantidadeEstoque: firebase.firestore.FieldValue.increment(item.quantidade)
                    });
                }
                
                await batch.commit();
            }
            
            // Atualizar status do pedido
            await db.collection('pedidos').doc(pedidoId).update({
                status: 'cancelada',
                motivoCancelamento: motivo.trim(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarNotificacao(`Pedido #${idPedido} cancelado com sucesso!`, 'success');
            
            // O listener em tempo real vai atualizar automaticamente
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
                item.preco.toFixed(2).replace('.', ','),
                (item.preco * item.quantidade).toFixed(2).replace('.', ','),
                pedido.data,
                index === 0 ? pedido.hora : '',
                pedido.status
            ];
            
            if (tipo === 'canceladas') {
                linha.push(pedido.motivoCancelamento || '');
            }
            
            csv += linha.join(';') + '\n';
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
    
    mostrarNotificacao(`Exportado: ${dados.length} ${tipo}`, 'success');
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-flutuante ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (notificacao.parentElement) {
            notificacao.remove();
        }
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

// Função para criar coleção de pedidos no Firebase (use apenas uma vez)
async function criarColecaoPedidos() {
    if (confirm('Esta função criará a estrutura de pedidos no Firebase. Continuar?')) {
        try {
            const db = firebase.firestore();
            
            // Criar um pedido de exemplo
            const pedidoExemplo = {
                idPedido: 'PEDEXEMPLO',
                itens: [{
                    produtoId: 'exemplo',
                    nome: 'Produto Exemplo',
                    preco: 25.90,
                    quantidade: 2,
                    totalItem: 51.80
                }],
                subtotal: 51.80,
                taxaEntrega: 5.00,
                total: 56.80,
                data: getDataAtual(),
                hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
                status: 'pendente',
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('pedidos').doc('PEDEXEMPLO').set(pedidoExemplo);
            
            alert('Coleção de pedidos criada com sucesso! Apagando pedido de exemplo...');
            
            // Apagar o exemplo
            await db.collection('pedidos').doc('PEDEXEMPLO').delete();
            
            alert('Pronto! A estrutura de pedidos está configurada.');
            configurarListenerTempoReal();
            
        } catch (error) {
            console.error('Erro ao criar coleção:', error);
            alert('Erro ao criar estrutura de pedidos');
        }
    }
}

// Adicionar funções ao escopo global
window.criarColecaoPedidos = criarColecaoPedidos;
window.finalizarVenda = finalizarVenda;
window.cancelarVenda = cancelarVenda;
window.abrirAbaPendentes = abrirAbaPendentes;