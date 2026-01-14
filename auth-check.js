// Verificador de autenticação para páginas protegidas
async function checkAuth() {
    try {
        // Verificar se Supabase está carregado
        if (!window.supabaseClient && typeof supabase !== 'undefined') {
            window.supabaseClient = supabase.createClient(
                "https://rfqwrqoszjbqdnxbroxj.supabase.co",
                "sb_publishable_SC-jhIzJmiasPJgXazW22g_x_3N80kD"
            );
        }
        
        const supabaseClient = window.supabaseClient;
        
        if (!supabaseClient) {
            console.error('Supabase não disponível');
            window.location.href = 'index.html';
            return null;
        }
        
        // Obter sessão atuala
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Erro ao verificar sessão:', error);
            window.location.href = 'index.html';
            return null;
        }
        
        // Se não houver sessão, redirecionar para login
        if (!data.session) {
            console.log('Usuário não autenticado, redirecionando...');
            window.location.href = 'index.html';
            return null;
        }
        
        // Retornar dados do usuário se estiver autenticado
        console.log('Usuário autenticado:', data.session.user.email);
        return data.session.user;
        
    } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        window.location.href = 'index.html';
        return null;
    }
}

// Função de logout
async function logout() {
    try {
        const supabaseClient = window.supabaseClient;
        
        if (!supabaseClient) {
            console.error('Supabase não disponível');
            return;
        }
        
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            console.error('Erro ao fazer logout:', error);
            return;
        }
        
        // Limpar email salvo
        localStorage.removeItem('savedEmail');
        
        // Redirecionar para login
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Exportar funções para uso global
window.checkAuth = checkAuth;
window.logout = logout;

// Verificar autenticação automaticamente se esta função for chamada
async function initAuth() {
    return await checkAuth();
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function() {
    // Só verifica se estiver em uma página protegida
    // Você pode adicionar uma verificação específica por página
    if (window.location.pathname.includes('dashboard') || 
        window.location.pathname.includes('admin') ||
        window.location.pathname.includes('protected')) {
        await checkAuth();
    }
});

// Funções de banco de dados
const DB_UTILS = {
    // Verificar se tabela existe
    tableExists: async function(tableName) {
        try {
            const client = this.initSupabase();
            if (!client) return false;
            
            const { data, error } = await client
                .from(tableName)
                .select('*')
                .limit(1);
            
            // Se não tem erro ou se o erro não é "tabela não existe"
            return !error || error.code !== '42P01';
        } catch (error) {
            console.error('Erro ao verificar tabela:', error);
            return false;
        }
    },
    
    // Contar registros em uma tabela
    countRecords: async function(tableName) {
        try {
            const client = this.initSupabase();
            if (!client) return 0;
            
            const { count, error } = await client
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Erro ao contar registros:', error);
            return 0;
        }
    }
};

// Combinar utilitários
const APP_UTILS = {
    ...AUTH_UTILS,
    ...DB_UTILS
};

// Exportar para uso global
window.appUtils = APP_UTILS;
