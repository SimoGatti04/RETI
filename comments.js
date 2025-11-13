// Sistema Commenti con Firebase
(function() {
    // ============================================
    // CONFIGURAZIONE FIREBASE
    // ============================================
    // IMPORTANTE: Sostituisci questi valori con quelli del tuo progetto Firebase
    // Vai su https://console.firebase.google.com per ottenere la configurazione
    const firebaseConfig = {
        apiKey: "AIzaSyAMpUAxKATJEbkE_kiae1TSlMlTaFu2gj0",
        authDomain: "class-bda53.firebaseapp.com",
        databaseURL: "https://class-bda53-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "class-bda53",
        storageBucket: "class-bda53.firebasestorage.app",
        messagingSenderId: "167876134694",
        appId: "1:167876134694:web:14bfc2a065b0be40c963e7"
    };

    // Inizializza Firebase (usa Realtime Database)
    if (typeof firebase === 'undefined') {
        console.error('Firebase non caricato. Assicurati di includere lo script Firebase.');
        return;
    }
    
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        // Firebase già inizializzato
        if (e.code !== 'app/duplicate-app') {
            console.error('Errore inizializzazione Firebase:', e);
            return;
        }
    }
    
    const database = firebase.database();

    // Funzioni di utilità
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Carica e mostra i commenti
    function loadComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;

        // Carica direttamente da comments/ (senza raggruppamento per pagina)
        const commentsRef = database.ref('comments');
        commentsRef.orderByChild('timestamp').on('value', (snapshot) => {
            const comments = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const comment = child.val();
                    if (comment && comment.approved) {
                        comments.push({ 
                            id: child.key, 
                            ...comment 
                        });
                    }
                });
            }
            
            // Ordina per timestamp (più recenti prima)
            comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            displayComments(comments);
        }, (error) => {
            console.error('Errore nel caricamento commenti:', error);
            container.innerHTML = '<p style="color: #dc3545; padding: 20px;">Errore nel caricamento dei commenti. Riprova più tardi.</p>';
        });
    }

    function displayComments(comments) {
        const container = document.getElementById('comments-list');
        if (!container) return;

        container.innerHTML = comments.map(comment => `
            <div class="comment-item" style="background: #f6f8fa; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #0366d6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <strong style="color: #0366d6; font-size: 1.05em;">${escapeHtml(comment.name)}</strong>
                    <span style="color: #666; font-size: 0.9em;">${formatDate(comment.timestamp)}</span>
                </div>
                <p style="margin: 0 0 10px 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(comment.text)}</p>
                ${comment.reply ? `
                    <div style="background: white; padding: 12px; border-radius: 4px; margin-top: 10px; border-left: 3px solid #28a745;">
                        <strong style="color: #28a745; display: block; margin-bottom: 5px;">Risposta:</strong>
                        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(comment.reply)}</p>
                        ${comment.replyTimestamp ? `<small style="color: #666; display: block; margin-top: 5px;">${formatDate(comment.replyTimestamp)}</small>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Gestione form commenti
    function initCommentForm() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('comment-name');
            const textInput = document.getElementById('comment-text');
            const messageDiv = document.getElementById('comment-message');
            const submitButton = form.querySelector('button[type="submit"]');
            
            const name = nameInput.value.trim();
            const text = textInput.value.trim();

            if (!name || !text) {
                if (messageDiv) {
                    messageDiv.innerHTML = '<p style="color: #dc3545; margin: 10px 0;">Compila tutti i campi!</p>';
                }
                return;
            }

            // Disabilita il pulsante durante l'invio
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Invio in corso...';
            }

            // Salva il commento (non approvato) direttamente in comments/
            const commentsRef = database.ref('comments');
            const newCommentRef = commentsRef.push();
            
            newCommentRef.set({
                name: name,
                text: text,
                timestamp: Date.now(),
                approved: false
            })
            .then(() => {
                if (messageDiv) {
                    messageDiv.innerHTML = '<p style="color: #28a745; margin: 10px 0;">✓ Commento inviato! Verrà pubblicato dopo l\'approvazione.</p>';
                }
                form.reset();
                setTimeout(() => {
                    if (messageDiv) messageDiv.innerHTML = '';
                }, 5000);
            })
            .catch((error) => {
                console.error('Errore:', error);
                if (messageDiv) {
                    messageDiv.innerHTML = '<p style="color: #dc3545; margin: 10px 0;">Errore nell\'invio. Riprova più tardi.</p>';
                }
            })
            .finally(() => {
                // Riabilita il pulsante
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Invia commento';
                }
            });
        });
    }

    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadComments();
            initCommentForm();
        });
    } else {
        loadComments();
        initCommentForm();
    }
})();

