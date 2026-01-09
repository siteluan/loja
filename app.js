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
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const rememberCheckbox = document.getElementById('remember');

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

    // Login com email e senha
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        setButtonLoading(true);
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login bem-sucedido
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
            })
            .catch((error) => {
                // Tratamento de erros
                let errorMessage = 'Erro ao fazer login.';
                
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'E-mail inválido.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Esta conta foi desativada.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'Não há usuário cadastrado com este e-mail.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erro de conexão. Verifique sua internet.';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showMessage(errorMessage, 'error');
                setButtonLoading(false);
            });
    });

    // Recuperação de senha
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showMessage('Digite seu e-mail para recuperar a senha.', 'error');
            return;
        }
        
        auth.sendPasswordResetEmail(email)
            .then(() => {
                showMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada.', 'success');
            })
            .catch((error) => {
                let errorMessage = 'Erro ao enviar e-mail de recuperação.';
                
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'E-mail inválido.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'Não há usuário cadastrado com este e-mail.';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showMessage(errorMessage, 'error');
            });
    });

    // Verificar se o usuário já está autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuário já está logado, redirecionar para dashboard.html
            showMessage('Você já está logado! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    });

});