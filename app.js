// Aguardar o carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const messageDiv = document.getElementById('message');
    const rememberCheckbox = document.getElementById('remember');

    // Verificar se Supabase está carregado
    if (!window.supabaseClient && typeof supabase !== 'undefined') {
        // Tentar inicializar se ainda não estiver
        window.supabaseClient = supabase.createClient(
            "https://rfqwrqoszjbqdnxbroxj.supabase.co",
            "sb_publishable_SC-jhIzJmiasPJgXazW22g_x_3N80kD"
        );
    }

    // Obter cliente Supabase
    const supabaseClient = window.supabaseClient;

    // Verificar se há credenciais salvas
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }

    // Alternar visibilidade da senha
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Mostrar mensagens na tela
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // Alternar estado do botão de login
    function setButtonLoading(loading) {
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
            loginBtn.disabled = true;
        } else {
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    // Verificar se usuário já está autenticado
    async function checkIfAlreadyLoggedIn() {
        try {
            if (!supabaseClient) {
                console.warn('Supabase client não disponível');
                return;
            }
            
            const { data, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Erro ao verificar sessão:', error);
                return;
            }
            
            // Se já tiver sessão, redireciona para o dashboard
            if (data.session) {
                console.log('Usuário já autenticado, redirecionando...');
                showMessage('Você já está logado! Redirecionando...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
        }
    }

    // Executar verificação ao carregar
    checkIfAlreadyLoggedIn();

    // Login com email e senha
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validações básicas
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        setButtonLoading(true);
        
        try {
            // Verificar se temos cliente Supabase
            if (!supabaseClient) {
                throw new Error('Conexão com o servidor não disponível');
            }
            
            // Login com Supabase
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            // Login bem-sucedido
            console.log('Login realizado:', data.user.email);
            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            
            // Salvar email se o checkbox estiver marcado
            if (rememberCheckbox.checked) {
                localStorage.setItem('savedEmail', email);
            } else {
                localStorage.removeItem('savedEmail');
            }
            
            // Redirecionar para dashboard.html após 1.5 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            // Tratamento de erros detalhado
            let errorMessage = 'Erro ao fazer login.';
            
            if (error.message) {
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'E-mail ou senha incorretos.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Confirme seu e-mail antes de fazer login.';
                } else if (error.message.includes('User not found')) {
                    errorMessage = 'Não há usuário cadastrado com este e-mail.';
                } else if (error.message.includes('Invalid email')) {
                    errorMessage = 'E-mail inválido.';
                } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Erro de conexão. Verifique sua internet.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            showMessage(errorMessage, 'error');
            setButtonLoading(false);
        }
    });

    // Escutar mudanças no estado de autenticação
    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Estado de autenticação alterado:', event);
            
            if (event === 'SIGNED_IN') {
                console.log('Usuário autenticado:', session.user.email);
            } else if (event === 'SIGNED_OUT') {
                console.log('Usuário deslogado');
            }
        });
    }
});