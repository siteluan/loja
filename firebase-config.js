// Configuração do Firebase - ÚNICO arquivo para todo o sistema
const firebaseConfig = {
    apiKey: "AIzaSyCqhEdlkEou8gubrZWdSh0-8a8tqVUWywA",
    authDomain: "cardapio-digital-f42e4.firebaseapp.com",
    projectId: "cardapio-digital-f42e4",
    storageBucket: "cardapio-digital-f42e4.firebasestorage.app",
    messagingSenderId: "171042548055",
    appId: "1:171042548055:web:4195ab9bd216ed447d7612"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Criar referências para os serviços (vão ser usadas em todos os arquivos)
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Exportar para uso global (se necessário)
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;