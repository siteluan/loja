// Dashboard Script com Supabase
document.addEventListener('DOMContentLoaded', async function() {
    // Configuração do Supabase
    const SUPABASE_URL = "https://rfqwrqoszjbqdnxbroxj.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_SC-jhIzJmiasPJgXazW22g_x_3N80kD";
    
    // Inicializar Supabase
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Elementos da interface
    const logoutBtn = document.getElementById('logoutBtn');
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const contentSections = document.querySelectorAll('.content-section');
    const backButtons = document.querySelectorAll('.btn-back');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const lastAccessElement = document.getElementById('lastAccess');

    // Verificar autenticação
    async function checkAuth() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Erro ao verificar sessão:', error);
                redirectToLogin();
                return null;
            }
            
            if (!session) {
                console.log('Usuário não autenticado');
                redirectToLogin();
                return null;
            }
            
            console.log('Usuário autenticado:', session.user.email);
            return session.user;
            
        } catch (error) {
            console.error('Erro na verificação de autenticação:', error);
            redirectToLogin();
            return null;
        }
    }
    
    // Redirecionar para login
    function redirectToLogin() {
        window.location.href = 'index.html';
    }
    
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
    
    // Atualizar último acesso
    function updateLastAccess() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        // Salvar no localStorage
        localStorage.setItem('lastAccess', now.toISOString());
        localStorage.setItem('lastAccessFormatted', `Hoje às ${hours}:${minutes}`);
        
        // Atualizar na interface
        if (lastAccessElement) {
            lastAccessElement.textContent = `Hoje às ${hours}:${minutes}`;
        }
    }
    
    // Carregar último acesso salvo
    function loadLastAccess() {
        const lastAccessFormatted = localStorage.getItem('lastAccessFormatted');
        if (lastAccessFormatted && lastAccessElement) {
            lastAccessElement.textContent = lastAccessFormatted;
        }
    }
    
    // Atualizar informações do usuário
    function updateUserInfo(user) {
        if (!user) return;
        
        // Mostrar email do usuário
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email;
        }
        
        // Atualizar mensagem de boas-vindas
        if (welcomeMessage) {
            const userName = user.email.split('@')[0];
            const hour = new Date().getHours();
            let greeting = '';
            
            if (hour < 12) greeting = 'Bom dia';
            else if (hour < 18) greeting = 'Boa tarde';
            else greeting = 'Boa noite';
            
            welcomeMessage.textContent = `${greeting}, ${userName}! Selecione uma das opções abaixo para gerenciar seu negócio:`;
        }
    }
    
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
    logoutBtn.addEventListener('click', async function() {
        if (confirm('Tem certeza que deseja sair da sua conta?')) {
            try {
                const { error } = await supabaseClient.auth.signOut();
                
                if (error) {
                    throw error;
                }
                
                // Limpar email salvo
                localStorage.removeItem('savedEmail');
                
                // Logout bem-sucedido
                window.location.href = 'index.html';
                
            } catch (error) {
                alert('Erro ao fazer logout: ' + error.message);
            }
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
    
    // Inicializar dashboard
    async function initDashboard() {
        // Verificar autenticação
        const user = await checkAuth();
        
        if (user) {
            // Atualizar informações do usuário
            updateUserInfo(user);
            
            // Atualizar último acesso
            updateLastAccess();
            
            // Carregar último acesso salvo
            loadLastAccess();
            
            // Atualizar data e hora
            updateDateTime();
            setInterval(updateDateTime, 1000);
        }
    }
    
    // Iniciar dashboard
    initDashboard();
    
    // Escutar mudanças no estado de autenticação
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Estado de autenticação alterado:', event);
        
        if (event === 'SIGNED_OUT') {
            // Redirecionar para login se deslogado
            redirectToLogin();
        } else if (event === 'SIGNED_IN' && session) {
            // Atualizar informações do usuário se logado
            updateUserInfo(session.user);
        }
    });
});