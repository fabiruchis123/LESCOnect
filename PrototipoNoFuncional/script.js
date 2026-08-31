// Variable global para rastrear la pantalla actual
let currentScreen = 'welcome-screen';
let historyList = [];

// Objeto para almacenar la información del usuario (con nombre, apellidos y cédula)
let userData = {
    nombre: 'Invitado',
    apellidos: '',
    cedula: 'N/A',
    telefono: 'N/A',
    emergencia: 'N/A'
};

// Lista de Contactos SOS de Emergencia (Mínimo 1, Máximo 5)
let sosContacts = [
    { id: 1, name: 'Mamá / Familiar Principal', phone: '8888-8888', relation: 'Familiar SOS' }
];

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Renderiza la lista de contactos SOS de Emergencia en el centro del módulo
 */
function renderSosContacts() {
    const list = document.getElementById('sos-contacts-list');
    const countLabel = document.getElementById('sos-count-label');
    const summaryCount = document.getElementById('sos-summary-count');
    const addBtn = document.getElementById('add-sos-contact-btn');

    const textCount = `${sosContacts.length} de 5 contactos registrados`;

    if (countLabel) countLabel.textContent = textCount;
    if (summaryCount) summaryCount.textContent = textCount;

    if (addBtn) {
        if (sosContacts.length >= 5) {
            addBtn.classList.add('opacity-40', 'cursor-not-allowed');
            addBtn.disabled = true;
        } else {
            addBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            addBtn.disabled = false;
        }
    }

    if (!list) return;

    list.innerHTML = sosContacts.map((c, index) => `
        <div class="p-3.5 bg-[#FBF6EE] rounded-2xl border border-[#EAE0D0] flex items-center justify-between shadow-sm">
            <div class="flex items-center space-x-3 text-left">
                <div class="w-10 h-10 rounded-xl bg-white text-[#B5551A] flex items-center justify-center font-display font-black text-sm border border-[#EAE0D0] shadow-sm">
                    ${index + 1}
                </div>
                <div>
                    <p class="font-display font-black text-sm text-[#2B241C] leading-tight">${escapeHtml(c.name)}</p>
                    <p class="text-xs text-[#7A6E5C] font-medium">${escapeHtml(c.phone)} • <span class="text-[#B5551A] font-bold">${escapeHtml(c.relation || 'SOS')}</span></p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <a href="tel:${escapeHtml(c.phone)}" class="px-3 py-1.5 bg-[#C0392B] hover:bg-[#A93226] text-white rounded-xl text-xs font-display font-bold shadow-sm transition active:scale-95 flex items-center space-x-1">
                    <span>📞</span><span>Llamar</span>
                </a>
                ${sosContacts.length > 1 ? `
                    <button onclick="deleteSosContact(${c.id})" class="w-7 h-7 rounded-lg bg-white border border-[#EAE0D0] text-[#7A6E5C] hover:text-[#C0392B] hover:border-[#F5B7B1] flex items-center justify-center text-xs transition" title="Eliminar contacto">
                        ✕
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

window.deleteSosContact = function(id) {
    if (sosContacts.length <= 1) {
        alert("Debes mantener al menos 1 contacto de emergencia SOS.");
        return;
    }
    sosContacts = sosContacts.filter(c => c.id !== id);
    renderSosContacts();
};

/**
 * Función principal para navegar entre pantallas
 */
function navigateTo(targetScreenId) {
    const targetElement = document.getElementById(targetScreenId);

    // Evita pantallas blancas si el ID no existe
    if (!targetElement) {
        console.error(`❌ ERROR: La pantalla "${targetScreenId}" no existe en el HTML.`);
        alert(`Pantalla no encontrada: ${targetScreenId}`);
        return;
    }

    // Oculta la pantalla actual
    const currentElement = document.getElementById(currentScreen);
    if (currentElement) {
        currentElement.style.display = 'none';
    }

    // Muestra la pantalla objetivo
    targetElement.style.display = (targetScreenId === 'welcome-screen') ? 'flex' : 'block';
    targetElement.scrollTo(0, 0);

    // Actualiza pantalla actual
    currentScreen = targetScreenId;

    if (targetScreenId === 'emergencies-screen' || targetScreenId === 'sos-contacts-screen') {
        renderSosContacts();
    }

    console.log(`📌 Navegando a: ${currentScreen}`);
}


/**
 * Actualiza la interfaz con los datos del usuario
 */
function updateUserDataDisplay() {
    const isGuest = userData.nombre === 'Invitado';

    // Actualizar nombre en Home
    const homeName = document.getElementById('user-display-name');
    if (homeName) {
        const displayName = isGuest ? 'Invitado' : userData.nombre;
        homeName.textContent = `¡Hola, ${displayName}! 👋`;
    }

    // Actualizar iniciales en Home
    const profileInitials = document.getElementById('user-initials');
    if (profileInitials) {
        profileInitials.textContent = getInitials();
    }

    // Actualizar pantalla de perfil
    updateProfileScreen(isGuest);
}

/**
 * Actualiza la pantalla de perfil dinámicamente
 */
function updateProfileScreen(isGuest) {
    const profileScreen = document.getElementById('profile-screen');
    if (!profileScreen) return;

    const fullName = isGuest ? 'Invitado' : `${userData.nombre} ${userData.apellidos || ''}`.trim();
    const cedulaText = userData.cedula && userData.cedula !== 'N/A' ? `Cédula: ${userData.cedula}` : 'Sin registrar';

    profileScreen.innerHTML = `
        <div class="max-w-3xl mx-auto w-full px-6 relative font-body">
            
            <!-- Botón de video en la esquina superior derecha del perfil -->
            <button class="camera-btn absolute top-4 right-4 p-2 rounded-xl text-[#B5551A] bg-[#F3EADA] hover:bg-[#EAE0D0] border border-[#EAE0D0] transition shadow-sm z-10"
                data-action="show-sign-video" data-message="Perfil de Usuario" title="Ver en señas">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z">
                    </path>
                </svg>
            </button>

            <div class="flex items-center mb-6">
                <button id="back-from-profile" class="w-10 h-10 rounded-2xl bg-white border border-[#EAE0D0] text-[#2B241C] hover:bg-[#F3EADA] flex items-center justify-center mr-3 shadow-sm transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" 
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                </button>
                <span class="text-xs font-display font-bold text-[#7A6E5C]">Volver a Home</span>
            </div>

            <h1 class="text-3xl font-display font-black text-[#2B241C] tracking-tight mb-1">Perfil</h1>
            <p class="text-sm text-[#7A6E5C] font-medium mb-6">Configuración de tu cuenta</p>

            <!-- Avatar circular -->
            <div class="flex flex-col items-center mb-8 text-center">
                <div class="w-28 h-28 bg-[#B5551A] text-white font-display font-black text-4xl flex items-center justify-center rounded-3xl shadow-xl shadow-[#B5551A]/20 ring-4 ring-[#F3EADA] mb-3">
                    ${getInitials()}
                </div>
                <h2 class="text-2xl font-display font-black text-[#2B241C]">${escapeHtml(fullName)}</h2>
                <p class="text-xs font-medium text-[#7A6E5C]">${escapeHtml(cedulaText)}</p>
                ${userData.telefono !== 'N/A' ? `<p class="text-xs font-medium text-[#7A6E5C] mt-0.5">${escapeHtml(userData.telefono)}</p>` : ''}
            </div>

            <!-- Opciones de perfil con botón de video en cada una -->
            <div class="space-y-3 mb-6 font-display">

                <!-- 1. Editar perfil -->
                <div class="w-full p-4 bg-white hover:bg-[#F3EADA] rounded-2xl border-2 border-[#EAE0D0] shadow-sm flex items-center justify-between transition">
                    <div id="edit-profile-button" class="flex items-center space-x-3.5 flex-1 cursor-pointer">
                        <div class="w-10 h-10 bg-[#F3EADA] text-[#B5551A] rounded-xl flex items-center justify-center font-bold text-lg">
                            ✏️
                        </div>
                        <div class="text-left font-body">
                            <p class="font-display font-bold text-sm text-[#2B241C]">Editar perfil</p>
                            <p class="text-xs text-[#7A6E5C]">Actualiza nombre, cédula y teléfonos</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="camera-btn p-2 rounded-xl text-[#B5551A] bg-[#F3EADA] hover:bg-[#EAE0D0] border border-[#EAE0D0] transition shadow-sm"
                            data-action="show-sign-video" data-message="Editar perfil - Videos" title="Ver en señas">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <span class="text-[#7A6E5C] font-bold">→</span>
                    </div>
                </div>

                <!-- 2. Tamaño de texto -->
                <div class="w-full p-4 bg-white hover:bg-[#F3EADA] rounded-2xl border-2 border-[#EAE0D0] shadow-sm flex items-center justify-between transition">
                    <div id="open-text-size-from-profile" class="size-text-btn flex items-center space-x-3.5 flex-1 cursor-pointer">
                        <div class="w-10 h-10 bg-[#EBF2EB] text-[#5C7A5C] rounded-xl flex items-center justify-center font-bold text-lg">
                            🔤
                        </div>
                        <div class="text-left font-body">
                            <p class="font-display font-bold text-sm text-[#2B241C]">Tamaño de texto</p>
                            <p class="text-xs text-[#7A6E5C]">Ajusta el tamaño de la letra</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="camera-btn p-2 rounded-xl text-[#5C7A5C] bg-[#EBF2EB] hover:bg-[#C8DAC8] border border-[#C8DAC8] transition shadow-sm"
                            data-action="show-sign-video" data-message="Tamaño de texto - Videos" title="Ver en señas">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <span class="text-[#7A6E5C] font-bold">→</span>
                    </div>
                </div>

                <!-- 3. Vibración -->
                <div class="w-full p-4 bg-white hover:bg-[#F3EADA] rounded-2xl border-2 border-[#EAE0D0] shadow-sm flex items-center justify-between transition">
                    <div id="open-vibration-from-profile" class="vibration-btn flex items-center space-x-3.5 flex-1 cursor-pointer">
                        <div class="w-10 h-10 bg-[#FEF9E7] text-[#B7950B] rounded-xl flex items-center justify-center font-bold text-lg">
                            📳
                        </div>
                        <div class="text-left font-body">
                            <p class="font-display font-bold text-sm text-[#2B241C]">Vibración</p>
                            <p class="text-xs text-[#7A6E5C]">Configurar alertas táctiles</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="camera-btn p-2 rounded-xl text-[#B7950B] bg-[#FEF9E7] hover:bg-[#F9E79F] border border-[#F9E79F] transition shadow-sm"
                            data-action="show-sign-video" data-message="Vibración - Videos" title="Ver en señas">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <span class="text-[#7A6E5C] font-bold">→</span>
                    </div>
                </div>

            </div>

            <!-- Información de contacto de emergencia -->
            ${!isGuest && userData.emergencia !== 'N/A' ? `
            <div class="bg-[#FDEDEC] border border-[#F5B7B1] p-4 rounded-2xl mb-6">
                <p class="font-display font-bold text-xs text-[#C0392B] uppercase tracking-wider mb-1">Contacto de emergencia</p>
                <p class="text-sm font-bold text-[#2B241C]">${escapeHtml(userData.emergencia)}</p>
            </div>
            ` : ''}

            <!-- Botón de cerrar sesión / login -->
            <button id="logout-button" 
                class="w-full ${isGuest ? 'bg-[#5C7A5C] hover:bg-[#4A634A]' : 'bg-white hover:bg-[#FDEDEC] text-[#C0392B] border-2 border-[#F5B7B1]'} 
                ${isGuest ? 'text-white' : ''} font-display font-bold py-4 rounded-2xl shadow-sm transition flex items-center justify-center active:scale-98">
                ${isGuest ? 'Iniciar sesión / Registrarse' : 'Cerrar sesión'}
            </button>
        </div>
    `;

    // Re-adjuntar listeners
    attachProfileListeners(isGuest);
}

/**
 * Obtiene las iniciales del usuario
 */
function getInitials() {
    const isGuest = userData.nombre === 'Invitado';
    if (isGuest) return 'I';

    let initials = '';
    if (userData.nombre) initials += userData.nombre.trim()[0];
    if (userData.apellidos) {
        initials += userData.apellidos.trim()[0];
    } else {
        const parts = userData.nombre.trim().split(' ');
        if (parts.length > 1) initials += parts[parts.length - 1][0];
    }
    return initials.toUpperCase() || 'P';
}

/**
 * Adjunta listeners a los botones del perfil
 */
function attachProfileListeners(isGuest) {
    document.getElementById('back-from-profile')?.addEventListener('click', () => {
        navigateTo('home-screen');
    });

    document.getElementById('logout-button')?.addEventListener('click', () => {
        if (isGuest) {
            navigateTo('signup-screen');
        } else {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                userData = {
                    nombre: 'Invitado',
                    telefono: 'N/A',
                    email: 'N/A',
                    emergencia: 'N/A'
                };
                updateUserDataDisplay();
                navigateTo('welcome-screen');
            }
        }
    });

    document.getElementById('edit-profile-button')?.addEventListener('click', () => {
        navigateTo('edit-profile-screen');
    });

    document.querySelector('.size-text-btn')?.addEventListener('click', () => {
        navigateTo('text-size-screen');
    });

    document.querySelector('.vibration-btn')?.addEventListener('click', () => {
        navigateTo('vibration-screen');
    });

}

// AGREGA un elemento al historial
function addToHistory(texto, tipo) {
    const fecha = new Date().toLocaleString('es-CR', { hour12: false });

    historyList.unshift({
        texto,
        tipo,
        fecha
    });

    updateHistoryUI();
}

// ACTUALIZA la pantalla del historial
function updateHistoryUI() {
    const container = document.getElementById("history-list");
    container.innerHTML = "";

    if (historyList.length === 0) {
        container.innerHTML = `
            <p class="text-gray-500 text-center">Aún no hay historial...</p>
        `;
        return;
    }

    historyList.forEach(item => {
        container.innerHTML += `
            <div class="p-4 bg-white rounded-xl shadow-md border-l-4 border-yellow-500">
                <p class="font-semibold">${item.tipo}: ${item.texto}</p>
                <small class="text-gray-500">${item.fecha}</small>
            </div>
        `;
    });
}



/**
 * Reproducción de voz en español para comunicación con oyentes (Text-to-Speech)
 */
function speakText(text) {
    if (!text) return;
    if (!('speechSynthesis' in window)) {
        alert("Tu navegador no soporta síntesis de voz.");
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CR'; // Español (Costa Rica / LATAM)
    utterance.rate = 0.92;    // Velocidad clara y comprensible
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
}

let currentVentanillaText = '';
let currentLescoPhrase = '';
let currentLescoGloss = '';

/**
 * Abre el Modal de Pantalla Gigante para mostrar al funcionario en ventanilla
 */
function openVentanillaModal(text, category = 'banco') {
    const modal = document.getElementById('ventanilla-modal');
    const modalText = document.getElementById('ventanilla-modal-text');
    if (!modal || !modalText) return;

    currentVentanillaText = text || '';
    modalText.textContent = `"${currentVentanillaText}"`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    addToHistory(currentVentanillaText, "Ventanilla Presencial");
}

/**
 * Cierra el Modal de Pantalla Gigante
 */
function closeVentanillaModal() {
    const modal = document.getElementById('ventanilla-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Abre el Modal Reproductor de Video en LESCO (Lengua Materna)
 */
function openLescoVideoModal(phrase, gloss) {
    const modal = document.getElementById('lesco-video-player-modal');
    const phraseTitle = document.getElementById('lesco-video-phrase-title');
    const glossEl = document.getElementById('lesco-video-gloss');
    const statusEl = document.getElementById('lesco-player-status');

    if (!modal) return;

    currentLescoPhrase = phrase || '';
    currentLescoGloss = gloss || 'SEÑAS LESCO';

    if (phraseTitle) phraseTitle.textContent = `"${currentLescoPhrase}"`;
    if (glossEl) glossEl.textContent = currentLescoGloss;
    if (statusEl) statusEl.textContent = "Reproduciendo seña en LESCO...";

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Cierra el Modal de Video en LESCO
 */
function closeLescoVideoModal() {
    const modal = document.getElementById('lesco-video-player-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Configura los eventos de frases, tarjetas de ventanilla y reproducción por voz
 */
function setupMessageSelection() {
    // Botones destacados para ver el video en señas LESCO primero
    document.querySelectorAll('.open-lesco-video-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const phrase = this.getAttribute('data-phrase') || '';
            const gloss = this.getAttribute('data-gloss') || 'LESCO';
            openLescoVideoModal(phrase, gloss);
        });
    });

    // Botones para mostrar en grande directamente
    document.querySelectorAll('.show-in-modal-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const text = this.getAttribute('data-text') || '';
            openVentanillaModal(text);
        });
    });

    // Botones de reproducción de voz (TTS)
    document.querySelectorAll('.speak-tts-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const text = this.getAttribute('data-text') || '';
            if (text) {
                speakText(text);
                addToHistory(text, "Voz reproducida");
            }
        });
    });

    // Botones de escape directo al traductor
    document.querySelectorAll('.go-to-speech-to-sign-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo('text-to-signs-screen');
        });
    });

    document.querySelectorAll('.go-to-sign-to-speech-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo('signs-to-text-screen');
        });
    });

    // Botones dentro del modal de ventanilla
    document.getElementById('ventanilla-modal-speak-btn')?.addEventListener('click', () => {
        if (currentVentanillaText) {
            speakText(currentVentanillaText);
        }
    });

    document.getElementById('ventanilla-modal-video-btn')?.addEventListener('click', () => {
        closeVentanillaModal();
        openLescoVideoModal(currentVentanillaText, "LESCO");
    });

    document.getElementById('close-ventanilla-modal-btn')?.addEventListener('click', closeVentanillaModal);
    document.getElementById('close-ventanilla-modal-btn-2')?.addEventListener('click', closeVentanillaModal);

    // Botones dentro del modal de Video LESCO
    document.getElementById('close-lesco-video-btn')?.addEventListener('click', closeLescoVideoModal);
    document.getElementById('close-lesco-video-btn-2')?.addEventListener('click', closeLescoVideoModal);

    document.getElementById('lesco-video-to-ventanilla-btn')?.addEventListener('click', () => {
        closeLescoVideoModal();
        openVentanillaModal(currentLescoPhrase);
    });

    document.getElementById('lesco-video-speak-btn')?.addEventListener('click', () => {
        if (currentLescoPhrase) {
            speakText(currentLescoPhrase);
            addToHistory(currentLescoPhrase, "Voz reproducida");
        }
    });

    document.getElementById('replay-lesco-video-btn')?.addEventListener('click', () => {
        const statusEl = document.getElementById('lesco-player-status');
        if (statusEl) {
            statusEl.textContent = "Reiniciando clip en LESCO...";
            setTimeout(() => {
                statusEl.textContent = "Reproduciendo seña en LESCO...";
            }, 600);
        }
    });

    // Configurar Despacho 9-1-1
    setupDispatchCategories();
}

/**
 * Abre y simula el despacho de emergencia hacia el 9-1-1
 */
function trigger911Dispatch(incident, agency, code) {
    const modal = document.getElementById('dispatch-911-modal');
    const loadingState = document.getElementById('dispatch-loading-state');
    const successState = document.getElementById('dispatch-success-state');
    const incidentEl = document.getElementById('dispatch-modal-incident');
    const agencyEl = document.getElementById('dispatch-modal-agency');
    const userEl = document.getElementById('dispatch-modal-user');
    const ticketCodeEl = document.getElementById('dispatch-ticket-code');

    if (!modal) return;

    if (incidentEl) incidentEl.textContent = incident || 'Emergencia General';
    if (agencyEl) agencyEl.textContent = agency || 'Sistema 9-1-1';
    if (userEl) userEl.textContent = `${userData.nombre} ${userData.apellidos || ''} (Cédula: ${userData.cedula})`;
    
    const randomTicket = `#CR-911-${Math.floor(10000 + Math.random() * 90000)}`;
    if (ticketCodeEl) ticketCodeEl.textContent = `Incidente Oficial: ${randomTicket}`;

    // Mostrar estado de transmisión
    loadingState?.classList.remove('hidden');
    successState?.classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // Simular recepción del 9-1-1 a los 1.2 segundos
    setTimeout(() => {
        loadingState?.classList.add('hidden');
        successState?.classList.remove('hidden');
        addToHistory(`🚨 Reporte 9-1-1 [${incident} - ${randomTicket}]`, "Despacho 9-1-1");
    }, 1200);
}

/**
 * Cierra el modal de despacho 9-1-1
 */
function close911DispatchModal() {
    const modal = document.getElementById('dispatch-911-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Configura las categorías de incidentes y botones de despacho 9-1-1
 */
function setupDispatchCategories() {
    document.querySelectorAll('.dispatch-cat-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');

            // Reset de estilo en botones de categorías
            document.querySelectorAll('.dispatch-cat-btn').forEach(b => {
                b.className = 'dispatch-cat-btn px-4 py-2.5 rounded-2xl text-xs font-display font-bold whitespace-nowrap bg-white text-[#7A6E5C] border border-[#EAE0D0] hover:bg-[#F3EADA] transition flex items-center space-x-1.5';
            });
            this.className = 'dispatch-cat-btn px-4 py-2.5 rounded-2xl text-xs font-display font-bold whitespace-nowrap bg-[#C0392B] text-white shadow-sm transition flex items-center space-x-1.5';

            // Ocultar otros paneles y mostrar el seleccionado
            document.querySelectorAll('.dispatch-category-content').forEach(c => {
                c.classList.add('hidden');
            });
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });

    document.querySelectorAll('.trigger-dispatch-911-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const incident = this.getAttribute('data-incident');
            const agency = this.getAttribute('data-agency');
            const code = this.getAttribute('data-code');
            trigger911Dispatch(incident, agency, code);
        });
    });

    document.getElementById('close-dispatch-modal-btn')?.addEventListener('click', close911DispatchModal);
    document.getElementById('ack-dispatch-modal-btn')?.addEventListener('click', close911DispatchModal);
}

/**
 * Inicialización cuando carga el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Ocultar todas las pantallas excepto la inicial
    document.querySelectorAll('.screen').forEach(screen => {
        if (screen.id !== currentScreen) {
            screen.style.display = 'none';
        } else {
            screen.style.display = 'flex';
        }
    });

    // Inicializar datos de usuario
    updateUserDataDisplay();

    // Setup de selección de mensajes
    setupMessageSelection();

    // === LISTENERS DE NAVEGACIÓN ===

    // Welcome -> Signup
    document.getElementById('to-signup-button')?.addEventListener('click', () => {
        navigateTo('signup-screen');
    });

    // Registro con Nombre, Apellidos y Cédula (Sin correo)
    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        userData.nombre = document.getElementById('nombre')?.value?.trim() || 'Invitado';
        userData.apellidos = document.getElementById('apellidos')?.value?.trim() || '';
        userData.cedula = document.getElementById('cedula')?.value?.trim() || 'N/A';
        userData.telefono = document.getElementById('telefono')?.value?.trim() || 'N/A';
        userData.emergencia = document.getElementById('emergencia')?.value?.trim() || 'N/A';

        // Si se ingresó contacto de emergencia, agregarlo a la lista SOS
        if (userData.emergencia && userData.emergencia !== 'N/A') {
            sosContacts[0] = {
                id: 1,
                name: 'Contacto SOS Principal',
                phone: userData.emergencia,
                relation: 'Familiar'
            };
        }

        updateUserDataDisplay();
        navigateTo('home-screen');
    });

    // Edición de Perfil con Nombre, Apellidos y Cédula
    document.getElementById('edit-profile-form')?.addEventListener('submit', (e) => {
        e.preventDefault();

        userData.nombre = document.getElementById('edit-nombre')?.value?.trim() || userData.nombre;
        userData.apellidos = document.getElementById('edit-apellidos')?.value?.trim() || userData.apellidos;
        userData.cedula = document.getElementById('edit-cedula')?.value?.trim() || userData.cedula;
        userData.telefono = document.getElementById('edit-telefono')?.value?.trim() || userData.telefono;
        userData.emergencia = document.getElementById('edit-emergencia')?.value?.trim() || userData.emergencia;

        if (userData.emergencia && userData.emergencia !== 'N/A' && sosContacts.length > 0) {
            sosContacts[0].phone = userData.emergencia;
        }

        updateUserDataDisplay();
        alert("Perfil actualizado correctamente");
        navigateTo('profile-screen');
    });

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.getAttribute('data-size');
            document.documentElement.style.fontSize = size + "px";
        });
    });

    document.getElementById('vibration-toggle')?.addEventListener('change', (e) => {
        if (e.target.checked && navigator.vibrate) {
            navigator.vibrate(200);
        }
    });

    // Delegación global para botones de video LESCO (camera-btn)
    document.addEventListener('click', (e) => {
        const cameraBtn = e.target.closest('.camera-btn');
        if (cameraBtn) {
            e.stopPropagation();
            const message = cameraBtn.getAttribute('data-message') || 'Contenido LESCO';
            alert(`Videos LESCO en proceso — "${message}"`);
        }
    });

    // Skip signup
    document.getElementById('skip-signup-button')?.addEventListener('click', () => {
        userData = { nombre: 'Invitado', apellidos: '', cedula: 'N/A', telefono: 'N/A', emergencia: 'N/A' };
        updateUserDataDisplay();
        navigateTo('home-screen');
    });

    // === HOME NAVIGATION & ACCESOS DIRECTOS SIN INTERMEDIARIOS ===
    // 1. Acceso directo: Señas a Voz (Cámara)
    document.getElementById('home-direct-signs-to-text')?.addEventListener('click', () => {
        navigateTo('signs-to-text-screen');
    });

    // 2. Acceso directo: Voz a Señas (Reproductor)
    document.getElementById('home-direct-text-to-signs')?.addEventListener('click', () => {
        navigateTo('text-to-signs-screen');
    });

    document.getElementById('to-quick-messages-button')?.addEventListener('click', () => {
        navigateTo('quick-messages-screen');
    });

    document.getElementById('to-emergencies-button')?.addEventListener('click', () => {
        navigateTo('emergencies-screen');
    });

    // Acceso a la pantalla dedicada de Contactos SOS desde Emergencias
    document.getElementById('to-sos-contacts-screen-btn')?.addEventListener('click', () => {
        renderSosContacts();
        navigateTo('sos-contacts-screen');
    });

    document.getElementById('back-from-sos-contacts')?.addEventListener('click', () => {
        navigateTo('emergencies-screen');
    });

    document.getElementById('to-history-button')?.addEventListener('click', () => {
        updateHistoryUI();
        navigateTo('history-screen');
    });

    document.getElementById('to-help-button')?.addEventListener('click', () => {
        navigateTo('help-screen');
    });

    // === GESTIÓN DE CONTACTOS SOS DE EMERGENCIA ===
    document.getElementById('add-sos-contact-btn')?.addEventListener('click', () => {
        if (sosContacts.length >= 5) {
            alert("Has alcanzado el límite máximo de 5 contactos de emergencia.");
            return;
        }
        const formContainer = document.getElementById('add-sos-form-container');
        if (formContainer) {
            formContainer.classList.toggle('hidden');
        }
    });

    document.getElementById('cancel-new-sos-btn')?.addEventListener('click', () => {
        const formContainer = document.getElementById('add-sos-form-container');
        if (formContainer) formContainer.classList.add('hidden');
    });

    document.getElementById('save-new-sos-btn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('new-sos-name');
        const phoneInput = document.getElementById('new-sos-phone');
        const relInput = document.getElementById('new-sos-relation');

        const name = nameInput?.value?.trim();
        const phone = phoneInput?.value?.trim();
        const relation = relInput?.value?.trim() || 'Familiar SOS';

        if (!name || !phone) {
            alert("Por favor ingresa al menos nombre y número de teléfono.");
            return;
        }

        if (sosContacts.length >= 5) {
            alert("Máximo 5 contactos permitidos.");
            return;
        }

        sosContacts.push({
            id: Date.now(),
            name,
            phone,
            relation
        });

        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (relInput) relInput.value = '';

        const formContainer = document.getElementById('add-sos-form-container');
        if (formContainer) formContainer.classList.add('hidden');

        renderSosContacts();
    });

    // === BACK BUTTONS ===
    document.getElementById('back-from-quick-messages')?.addEventListener('click', () => {
        navigateTo('home-screen');
    });

    document.getElementById('back-from-emergencies')?.addEventListener('click', () => {
        navigateTo('home-screen');
    });

    document.getElementById('back-from-history')?.addEventListener('click', () => {
        navigateTo('home-screen');
    });

    document.getElementById('back-from-help')?.addEventListener('click', () => {
        navigateTo('home-screen');
    });

    // === CATEGORÍAS DE MENSAJES ===
    document.getElementById('to-messages-emergencia')?.addEventListener('click', () => {
        navigateTo('messages-emergencia-screen');
    });

    document.getElementById('to-messages-policia')?.addEventListener('click', () => {
        navigateTo('messages-policia-screen');
    });

    document.getElementById('to-messages-hospital')?.addEventListener('click', () => {
        navigateTo('messages-hospital-screen');
    });

    document.getElementById('to-messages-banco')?.addEventListener('click', () => {
        navigateTo('messages-banco-screen');
    });

    document.getElementById('to-messages-generales')?.addEventListener('click', () => {
        navigateTo('messages-generales-screen');
    });

    // Accesos directos desde Home
    document.getElementById('home-to-messages-hospital')?.addEventListener('click', () => {
        navigateTo('messages-hospital-screen');
    });
    document.getElementById('home-to-messages-policia')?.addEventListener('click', () => {
        navigateTo('messages-policia-screen');
    });
    document.getElementById('home-to-messages-banco')?.addEventListener('click', () => {
        navigateTo('messages-banco-screen');
    });
    document.getElementById('home-to-messages-generales')?.addEventListener('click', () => {
        navigateTo('messages-generales-screen');
    });

    // Back de categorías a lista general
    document.getElementById('back-from-messages-emergencia')?.addEventListener('click', () => {
        navigateTo('quick-messages-screen');
    });
    document.getElementById('back-from-messages-policia')?.addEventListener('click', () => {
        navigateTo('quick-messages-screen');
    });
    document.getElementById('back-from-messages-hospital')?.addEventListener('click', () => {
        navigateTo('quick-messages-screen');
    });
    document.getElementById('back-from-messages-banco')?.addEventListener('click', () => {
        navigateTo('quick-messages-screen');
    });
    document.getElementById('back-from-messages-generales')?.addEventListener('click', () => {
        navigateTo('quick-messages-screen');
    });

    // === NAVEGACIÓN A PANTALLAS DEDICADAS POR SITUACIÓN ===
    // Emergencias
    document.getElementById('to-emergencia-tramite-auxilio')?.addEventListener('click', () => {
        navigateTo('emergencia-tramite-auxilio-screen');
    });
    document.getElementById('to-emergencia-tramite-salud')?.addEventListener('click', () => {
        navigateTo('emergencia-tramite-salud-screen');
    });
    document.getElementById('to-emergencia-tramite-rescate')?.addEventListener('click', () => {
        navigateTo('emergencia-tramite-rescate-screen');
    });

    document.getElementById('back-from-emergencia-auxilio')?.addEventListener('click', () => {
        navigateTo('messages-emergencia-screen');
    });
    document.getElementById('back-from-emergencia-salud')?.addEventListener('click', () => {
        navigateTo('messages-emergencia-screen');
    });
    document.getElementById('back-from-emergencia-rescate')?.addEventListener('click', () => {
        navigateTo('messages-emergencia-screen');
    });

    // Policía
    document.getElementById('to-policia-tramite-identificacion')?.addEventListener('click', () => {
        navigateTo('policia-tramite-identificacion-screen');
    });
    document.getElementById('to-policia-tramite-denuncias')?.addEventListener('click', () => {
        navigateTo('policia-tramite-denuncias-screen');
    });
    document.getElementById('to-policia-tramite-ubicacion')?.addEventListener('click', () => {
        navigateTo('policia-tramite-ubicacion-screen');
    });

    document.getElementById('back-from-policia-identificacion')?.addEventListener('click', () => {
        navigateTo('messages-policia-screen');
    });
    document.getElementById('back-from-policia-denuncias')?.addEventListener('click', () => {
        navigateTo('messages-policia-screen');
    });
    document.getElementById('back-from-policia-ubicacion')?.addEventListener('click', () => {
        navigateTo('messages-policia-screen');
    });

    // Hospital
    document.getElementById('to-hospital-tramite-admision')?.addEventListener('click', () => {
        navigateTo('hospital-tramite-admision-screen');
    });
    document.getElementById('to-hospital-tramite-farmacia')?.addEventListener('click', () => {
        navigateTo('hospital-tramite-farmacia-screen');
    });
    document.getElementById('to-hospital-tramite-sintomas')?.addEventListener('click', () => {
        navigateTo('hospital-tramite-sintomas-screen');
    });

    document.getElementById('back-from-hospital-admision')?.addEventListener('click', () => {
        navigateTo('messages-hospital-screen');
    });
    document.getElementById('back-from-hospital-farmacia')?.addEventListener('click', () => {
        navigateTo('messages-hospital-screen');
    });
    document.getElementById('back-from-hospital-sintomas')?.addEventListener('click', () => {
        navigateTo('messages-hospital-screen');
    });

    // Banco
    document.getElementById('to-banco-tramite-cuentas')?.addEventListener('click', () => {
        navigateTo('banco-tramite-cuentas-screen');
    });
    document.getElementById('to-banco-tramite-caja')?.addEventListener('click', () => {
        navigateTo('banco-tramite-caja-screen');
    });
    document.getElementById('to-banco-tramite-firmas')?.addEventListener('click', () => {
        navigateTo('banco-tramite-firmas-screen');
    });

    document.getElementById('back-from-banco-cuentas')?.addEventListener('click', () => {
        navigateTo('messages-banco-screen');
    });
    document.getElementById('back-from-banco-caja')?.addEventListener('click', () => {
        navigateTo('messages-banco-screen');
    });
    document.getElementById('back-from-banco-firmas')?.addEventListener('click', () => {
        navigateTo('messages-banco-screen');
    });

    // Generales
    document.getElementById('to-generales-tramite-saludos')?.addEventListener('click', () => {
        navigateTo('generales-tramite-saludos-screen');
    });
    document.getElementById('to-generales-tramite-escrita')?.addEventListener('click', () => {
        navigateTo('generales-tramite-escrita-screen');
    });
    document.getElementById('to-generales-tramite-preguntas')?.addEventListener('click', () => {
        navigateTo('generales-tramite-preguntas-screen');
    });

    document.getElementById('back-from-generales-saludos')?.addEventListener('click', () => {
        navigateTo('messages-generales-screen');
    });
    document.getElementById('back-from-generales-escrita')?.addEventListener('click', () => {
        navigateTo('messages-generales-screen');
    });
    document.getElementById('back-from-generales-preguntas')?.addEventListener('click', () => {
        navigateTo('messages-generales-screen');
    });

    // === TRADUCTOR ===
    document.getElementById('to-signs-to-text')?.addEventListener('click', () => {
        navigateTo('signs-to-text-screen');
    });

    document.getElementById('to-text-to-signs')?.addEventListener('click', () => {
        navigateTo('text-to-signs-screen');
    });

    document.getElementById('back-to-translator-from-signs')?.addEventListener('click', () => {
        navigateTo('translator-screen');
    });

    document.getElementById('back-to-translator-from-text')?.addEventListener('click', () => {
        navigateTo('translator-screen');
    });

    document.getElementById('back-from-edit-profile')?.addEventListener('click', () => {
        navigateTo('profile-screen');
    });

    document.getElementById('back-from-text-size')?.addEventListener('click', () => {
        navigateTo('profile-screen');
    });

    document.getElementById('back-from-vibration')?.addEventListener('click', () => {
        navigateTo('profile-screen');
    });

    document.getElementById('back-from-translator-main')?.addEventListener('click', () => {
        navigateTo('home-screen');
    });
}); // fin DOMContentLoaded

// Reemplazar cualquier listener anterior de 'user-initials' por este bloque seguro:
(function attachProfileClickOnce() {
    const initials = document.getElementById('user-initials');
    if (!initials) return;
    // Evitar duplicados
    if (initials.dataset.listenerAttached === '1') return;
    initials.dataset.listenerAttached = '1';
    initials.style.cursor = 'pointer';

    initials.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[DEBUG] click en user-initials recibido.');

        // Obtener elementos del perfil de forma segura
        const profileNombre = document.getElementById('profile-nombre');
        const profileTelefono = document.getElementById('profile-telefono');
        const profileEmail = document.getElementById('profile-email');
        const profileEmergencia = document.getElementById('profile-emergencia');
        const ps = document.getElementById('profile-screen');

        if (!ps) {
            console.error('[DEBUG] profile-screen NO existe en el DOM');
            return;
        }

        // Rellenar solo si existen los nodos en el DOM
        if (profileNombre) profileNombre.textContent = (window.userData && userData.nombre) || 'Invitado';
        if (profileTelefono) profileTelefono.textContent = (window.userData && userData.telefono) || '--';
        if (profileEmail) profileEmail.textContent = (window.userData && userData.email) || '--';
        if (profileEmergencia) profileEmergencia.textContent = (window.userData && userData.emergencia) || '--';

        // Navegación: usa tu función navigateTo si existe, si no, muestra manualmente
        if (typeof navigateTo === 'function') {
            navigateTo('profile-screen');
        } else {
            // Fallback seguro
            document.querySelectorAll('.screen').forEach(s => {
                s.classList.add('hidden');
                s.style.display = '';
            });
            ps.classList.remove('hidden');
            ps.style.display = 'block';
        }

        console.log('[DEBUG] profile-screen mostrado (forzado/por navigateTo).');
    });
})();

// Manejo unificado de botones de cámara -> modal "Videos en proceso"
(function setupSignVideoButtons() {
    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function openSignVideoModal(categoryMessage) {
        if (document.getElementById('lesco-video-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'lesco-video-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4';
        modal.innerHTML = `
            <div class="bg-[#FBF6EE] border-2 border-[#EAE0D0] rounded-3xl w-full max-w-md p-6 relative shadow-2xl font-body">
                <button id="lesco-video-close" class="w-8 h-8 rounded-full bg-white border border-[#EAE0D0] text-[#7A6E5C] hover:bg-[#F3EADA] hover:text-[#2B241C] flex items-center justify-center absolute top-4 right-4 transition">✕</button>

                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-[#F3EADA] border border-[#EAE0D0] flex items-center justify-center text-2xl">
                        🤟
                    </div>
                    <div>
                        <div class="text-lg font-display font-black text-[#2B241C]">Videos en proceso</div>
                        <div class="text-xs text-[#7A6E5C] font-medium">Contenido LESCO próximamente</div>
                    </div>
                </div>

                <div class="bg-white border-2 border-[#EAE0D0] rounded-2xl p-4 text-center text-sm font-medium text-[#2B241C]">
                    ${escapeHtml(categoryMessage || 'Videos en proceso')}
                </div>

                <div class="mt-5 flex justify-end">
                    <button id="lesco-video-ok" class="px-5 py-2.5 bg-[#B5551A] hover:bg-[#9C4410] text-white font-display font-bold text-sm rounded-xl shadow-md transition active:scale-95">Entendido</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => {
            const m = document.getElementById('lesco-video-modal');
            if (m) m.remove();
        };
        document.getElementById('lesco-video-close').addEventListener('click', close);
        document.getElementById('lesco-video-ok').addEventListener('click', close);
        modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });

        console.log('openSignVideoModal:', categoryMessage);
    }

    // Delegación global: captura cualquier botón con data-action="show-sign-video"
    document.addEventListener('click', (ev) => {
        const btn = ev.target.closest && ev.target.closest('[data-action="show-sign-video"]');
        if (!btn) return;
        ev.preventDefault();
        const message = btn.dataset.message ? `Videos en proceso — ${btn.dataset.message}` : 'Videos en proceso';
        openSignVideoModal(message);
    });
})();
