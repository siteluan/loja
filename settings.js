// Settings Script
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');
    
    // Botões de ações
    const saveAllBtn = document.getElementById('saveAllBtn');
    const updatePersonalInfoBtn = document.getElementById('updatePersonalInfo');
    const cancelPersonalInfoBtn = document.getElementById('cancelPersonalInfo');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const applyNotificationsBtn = document.getElementById('applyNotificationsBtn');
    const saveAddressBtn = document.getElementById('saveAddressBtn');
    const addCardBtn = document.getElementById('addCardBtn');
    const savePaymentBtn = document.getElementById('savePaymentBtn');
    const savePrivacyBtn = document.getElementById('savePrivacyBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const disableAccountBtn = document.getElementById('disableAccountBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    // Elementos do formulário
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const dataNascimentoInput = document.getElementById('dataNascimento');
    const senhaAtualInput = document.getElementById('senhaAtual');
    const novaSenhaInput = document.getElementById('novaSenha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const enderecoPadraoSelect = document.getElementById('enderecoPadrao');
    const instrucoesEspeciaisTextarea = document.getElementById('instrucoesEspeciais');
    
    // Toggle switches
    const twoFactorAuthCheckbox = document.getElementById('twoFactorAuth');
    const notifyEmailCheckbox = document.getElementById('notifyEmail');
    const notifySMSCheckbox = document.getElementById('notifySMS');
    const notifyPromoCheckbox = document.getElementById('notifyPromo');
    const notifyOrdersCheckbox = document.getElementById('notifyOrders');
    const deliveryContactlessCheckbox = document.getElementById('deliveryContactless');
    const ecoPackagingCheckbox = document.getElementById('ecoPackaging');
    const saveCardsCheckbox = document.getElementById('saveCards');
    const publicProfileCheckbox = document.getElementById('publicProfile');
    const saveOrderHistoryCheckbox = document.getElementById('saveOrderHistory');
    const shareDataCheckbox = document.getElementById('shareData');
    const receiveSurveysCheckbox = document.getElementById('receiveSurveys');
    
    // Radio buttons
    const paymentRadios = document.querySelectorAll('input[name="pagamento"]');
    
    // Verificar se o usuário está autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Usuário autenticado
            userName.textContent = user.displayName || user.email.split('@')[0];
            userEmail.textContent = user.email;
            
            // Carregar dados do usuário do localStorage (simulação)
            loadUserSettings();
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
    
    // Carregar configurações do usuário (simulação)
    function loadUserSettings() {
        // Simular carregamento de dados do localStorage
        const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        
        // Preencher campos com dados salvos
        if (savedSettings.nome) nomeInput.value = savedSettings.nome;
        if (savedSettings.telefone) telefoneInput.value = savedSettings.telefone;
        if (savedSettings.dataNascimento) dataNascimentoInput.value = savedSettings.dataNascimento;
        if (savedSettings.enderecoPadrao) enderecoPadraoSelect.value = savedSettings.enderecoPadrao;
        if (savedSettings.instrucoesEspeciais) instrucoesEspeciaisTextarea.value = savedSettings.instrucoesEspeciais;
        
        // Configurar toggles
        if (savedSettings.twoFactorAuth !== undefined) twoFactorAuthCheckbox.checked = savedSettings.twoFactorAuth;
        if (savedSettings.notifyEmail !== undefined) notifyEmailCheckbox.checked = savedSettings.notifyEmail;
        if (savedSettings.notifySMS !== undefined) notifySMSCheckbox.checked = savedSettings.notifySMS;
        if (savedSettings.notifyPromo !== undefined) notifyPromoCheckbox.checked = savedSettings.notifyPromo;
        if (savedSettings.notifyOrders !== undefined) notifyOrdersCheckbox.checked = savedSettings.notifyOrders;
        if (savedSettings.deliveryContactless !== undefined) deliveryContactlessCheckbox.checked = savedSettings.deliveryContactless;
        if (savedSettings.ecoPackaging !== undefined) ecoPackagingCheckbox.checked = savedSettings.ecoPackaging;
        if (savedSettings.saveCards !== undefined) saveCardsCheckbox.checked = savedSettings.saveCards;
        if (savedSettings.publicProfile !== undefined) publicProfileCheckbox.checked = savedSettings.publicProfile;
        if (savedSettings.saveOrderHistory !== undefined) saveOrderHistoryCheckbox.checked = savedSettings.saveOrderHistory;
        if (savedSettings.shareData !== undefined) shareDataCheckbox.checked = savedSettings.shareData;
        if (savedSettings.receiveSurveys !== undefined) receiveSurveysCheckbox.checked = savedSettings.receiveSurveys;
        
        // Configurar método de pagamento padrão
        if (savedSettings.paymentMethod) {
            document.querySelector(`input[name="pagamento"][value="${savedSettings.paymentMethod}"]`).checked = true;
        }
    }
    
    // Salvar configurações do usuário (simulação)
    function saveUserSettings() {
        const userSettings = {
            nome: nomeInput.value,
            telefone: telefoneInput.value,
            dataNascimento: dataNascimentoInput.value,
            enderecoPadrao: enderecoPadraoSelect.value,
            instrucoesEspeciais: instrucoesEspeciaisTextarea.value,
            twoFactorAuth: twoFactorAuthCheckbox.checked,
            notifyEmail: notifyEmailCheckbox.checked,
            notifySMS: notifySMSCheckbox.checked,
            notifyPromo: notifyPromoCheckbox.checked,
            notifyOrders: notifyOrdersCheckbox.checked,
            deliveryContactless: deliveryContactlessCheckbox.checked,
            ecoPackaging: ecoPackagingCheckbox.checked,
            saveCards: saveCardsCheckbox.checked,
            publicProfile: publicProfileCheckbox.checked,
            saveOrderHistory: saveOrderHistoryCheckbox.checked,
            shareData: shareDataCheckbox.checked,
            receiveSurveys: receiveSurveysCheckbox.checked,
            paymentMethod: document.querySelector('input[name="pagamento"]:checked').value
        };
        
        // Salvar no localStorage (em uma aplicação real, seria salvo no servidor)
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        
        // Mostrar mensagem de sucesso
        showNotification('Configurações salvas com sucesso!', 'success');
    }
    
    // Mostrar notificação
    function showNotification(message, type = 'info') {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Adicionar estilos para a notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        // Adicionar animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1rem;
            }
        `;
        document.head.appendChild(style);
        
        // Adicionar ao body
        document.body.appendChild(notification);
        
        // Fechar notificação ao clicar no botão
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // Validar formulário de senha
    function validatePasswordForm() {
        const senhaAtual = senhaAtualInput.value;
        const novaSenha = novaSenhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;
        
        if (!senhaAtual) {
            showNotification('Por favor, digite sua senha atual', 'error');
            return false;
        }
        
        if (!novaSenha || novaSenha.length < 8) {
            showNotification('A nova senha deve ter pelo menos 8 caracteres', 'error');
            return false;
        }
        
        if (novaSenha !== confirmarSenha) {
            showNotification('As senhas não coincidem', 'error');
            return false;
        }
        
        return true;
    }
    
    // Event Listeners
    
    // Salvar todas as alterações
    saveAllBtn.addEventListener('click', function() {
        saveUserSettings();
    });
    
    // Atualizar informações pessoais
    updatePersonalInfoBtn.addEventListener('click', function() {
        if (!nomeInput.value || !emailInput.value) {
            showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        saveUserSettings();
        showNotification('Informações pessoais atualizadas com sucesso!', 'success');
    });
    
    // Cancelar alterações nas informações pessoais
    cancelPersonalInfoBtn.addEventListener('click', function() {
        // Restaurar valores originais (simulação)
        loadUserSettings();
        showNotification('Alterações canceladas', 'info');
    });
    
    // Alterar senha
    changePasswordBtn.addEventListener('click', function() {
        if (validatePasswordForm()) {
            // Simular alteração de senha
            senhaAtualInput.value = '';
            novaSenhaInput.value = '';
            confirmarSenhaInput.value = '';
            showNotification('Senha alterada com sucesso!', 'success');
        }
    });
    
    // Aplicar preferências de notificação
    applyNotificationsBtn.addEventListener('click', function() {
        saveUserSettings();
        showNotification('Preferências de notificação aplicadas!', 'success');
    });
    
    // Salvar endereço
    saveAddressBtn.addEventListener('click', function() {
        saveUserSettings();
        showNotification('Preferências de entrega salvas!', 'success');
    });
    
    // Adicionar cartão (simulação)
    addCardBtn.addEventListener('click', function() {
        showNotification('Redirecionando para adição de cartão...', 'info');
        // Em uma aplicação real, abriria um modal ou redirecionaria
    });
    
    // Salvar método de pagamento
    savePaymentBtn.addEventListener('click', function() {
        saveUserSettings();
        showNotification('Método de pagamento salvo!', 'success');
    });
    
    // Salvar configurações de privacidade
    savePrivacyBtn.addEventListener('click', function() {
        saveUserSettings();
        showNotification('Configurações de privacidade salvas!', 'success');
    });
    
    // Exportar dados
    exportDataBtn.addEventListener('click', function() {
        if (confirm('Isso gerará um arquivo com todos os seus dados. Deseja continuar?')) {
            // Simular exportação de dados
            setTimeout(() => {
                showNotification('Arquivo de exportação gerado com sucesso!', 'success');
            }, 1500);
        }
    });
    
    // Desativar conta
    disableAccountBtn.addEventListener('click', function() {
        if (confirm('Sua conta será desativada temporariamente. Você não poderá acessar o sistema até reativá-la. Deseja continuar?')) {
            // Simular desativação de conta
            setTimeout(() => {
                showNotification('Conta desativada temporariamente. Você será redirecionado para a página de login.', 'warning');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }, 1000);
        }
    });
    
    // Excluir conta permanentemente
    deleteAccountBtn.addEventListener('click', function() {
        if (confirm('ATENÇÃO: Esta ação é irreversível! Todos os seus dados serão permanentemente excluídos. Deseja continuar?')) {
            const confirmText = prompt('Digite "EXCLUIR CONTA" para confirmar:');
            if (confirmText === 'EXCLUIR CONTA') {
                // Simular exclusão de conta
                setTimeout(() => {
                    showNotification('Conta excluída permanentemente. Redirecionando...', 'error');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }, 1000);
            } else {
                showNotification('Exclusão cancelada. O texto não corresponde.', 'error');
            }
        }
    });
    
    // Menu toggle para mobile
    function setupMobileMenu() {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        document.body.appendChild(menuToggle);
        
        const sidebar = document.querySelector('.sidebar');
        
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            menuToggle.innerHTML = sidebar.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Fechar menu ao clicar em um link
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 480) {
                    sidebar.classList.remove('active');
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 480 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
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
    
    // Salvar automaticamente ao mudar alguns campos
    enderecoPadraoSelect.addEventListener('change', function() {
        // Salvar apenas este campo
        const settings = JSON.parse(localStorage.getItem('userSettings')) || {};
        settings.enderecoPadrao = this.value;
        localStorage.setItem('userSettings', JSON.stringify(settings));
    });
    
    // Inicializar dados se não existirem
    if (!localStorage.getItem('userSettings')) {
        saveUserSettings();
    }
});