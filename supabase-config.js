// supabase-config.js
const SUPABASE_URL = "https://rfqwrqoszjbqdnxbroxj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SC-jhIzJmiasPJgXazW22g_x_3N80kD";

// Inicializar cliente Supabase
let supabaseClient;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase inicializado com sucesso');
    } else {
        console.error('❌ Biblioteca Supabase não encontrada');
    }
});

// Função para obter o cliente
function getSupabaseClient() {
    if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// Exportar para uso global
window.getSupabaseClient = getSupabaseClient;