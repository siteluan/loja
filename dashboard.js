// Dashboard Script
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const contentSections = document.querySelectorAll('.content-section');
    const backButtons = document.querySelectorAll('.btn-back');
    
    // Verificar se o usuário está autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuário autenticado
            userName.textContent = user.displayName || user.email.split('@')[0];
            userEmail.textContent = user.email;
            
            // Salvar último acesso
            const now = new Date();
            localStorage.setItem('lastAccess', now.toISOString());
            
            // Atualizar último acesso na interface
            const lastAccessElement = document.getElementById('lastAccess');
            if (lastAccessElement) {
                lastAccessElement.textContent = `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            }
        } else {
            // Usuário não autenticado, redirecionar para login
            window.location.href = 'index.html';
        }
    });
    
    // Atualizar data e hora
    function updateDateTime() {
        const now = new Date();
        
        // Formatar data
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDate.textContent = now.toLocaleDateString('pt-BR', options);
        
        // Formatar hora
        currentTime.textContent = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // Atualizar a cada segundo
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Navegação do sidebar - APENAS para links internos (com data-section)
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Se o link tem um href com .html, deixa navegar normalmente
            if (this.getAttribute('href') && this.getAttribute('href').endsWith('.html')) {
                return; // Permite navegação normal
            }
            
            e.preventDefault();
            
            // Remover classe active de todos os links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            this.classList.add('active');
            
            // Obter a seção correspondente
            const sectionId = this.getAttribute('data-section');
            
            // Atualizar título e subtítulo
            updatePageTitle(sectionId);
            
            // Mostrar a seção correspondente
            showSection(sectionId);
        });
    });
    
    // Navegação dos cards do dashboard - APENAS para cards internos
    dashboardCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Se o card tem um href com .html, deixa navegar normalmente
            if (this.getAttribute('href') && this.getAttribute('href').endsWith('.html')) {
                return; // Permite navegação normal
            }
            
            e.preventDefault();
            
            // Obter a seção correspondente
            const sectionId = this.getAttribute('data-section');
            
            // Atualizar sidebar
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('data-section') === sectionId) {
                    l.classList.add('active');
                }
            });
            
            // Atualizar título e subtítulo
            updatePageTitle(sectionId);
            
            // Mostrar a seção correspondente
            showSection(sectionId);
        });
    });
    
    // Função para atualizar título da página
    function updatePageTitle(sectionId) {
        const titles = {
            'dashboard': {
                title: 'Painel Administrativo',
                subtitle: 'Gerencie seu negócio de forma simples e eficiente'
            },
            'products': {
                title: 'Cadastrar Produtos',
                subtitle: 'Gerencie o catálogo de produtos'
            },
            'menu': {
                title: 'Cardápio Online',
                subtitle: 'Visualize e gere o cardápio digital'
            },
            'sales': {
                title: 'Vendas do Dia',
                subtitle: 'Acompanhe relatórios e métricas de vendas'
            },
            'settings': {
                title: 'Configurações',
                subtitle: 'Gerencie sua conta e preferências'
            }
        };
        
        if (titles[sectionId]) {
            pageTitle.textContent = titles[sectionId].title;
            pageSubtitle.textContent = titles[sectionId].subtitle;
        }
    }
    
    // Função para mostrar seção
    function showSection(sectionId) {
        // Esconder todas as seções
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar a seção correspondente
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Botões de voltar
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Se é um link <a>, não faz nada (já navega)
            if (this.tagName === 'A') {
                return;
            }
            
            // Se é um botão, volta para dashboard
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('data-section') === 'dashboard') {
                    l.classList.add('active');
                }
            });
            
            updatePageTitle('dashboard');
            showSection('dashboard');
        });
    });
    
    // Logout
    logoutBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja sair da sua conta?')) {
            auth.signOut().then(() => {
                // Logout bem-sucedido
                window.location.href = 'index.html';
            }).catch((error) => {
                alert('Erro ao fazer logout: ' + error.message);
            });
        }
    });
    
    // Menu toggle para mobile (opcional)
    function setupMobileMenu() {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(menuToggle);
        
        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
        
        // Fechar menu ao clicar em um link
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 480) {
                    document.querySelector('.sidebar').classList.remove('active');
                }
            });
        });
    }
    
    // Inicializar menu mobile se necessário
    if (window.innerWidth <= 480) {
        setupMobileMenu();
    }
    
    // Adicionar evento de redimensionamento
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 480 && !document.querySelector('.menu-toggle')) {
            setupMobileMenu();
        }
    });
});