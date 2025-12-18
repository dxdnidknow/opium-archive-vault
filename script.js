document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 🔒 MÓDULO DE SEGURIDAD (ANTI-COPY SYSTEM)
    // ==========================================
    const protectSystem = () => {
        // 1. Bloquear Clic Derecho
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // 2. Bloquear Teclas de Desarrollo (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S)
        document.onkeydown = function(e) {
            if (e.keyCode == 123) return false; // F12
            if (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) return false; // Ctrl+Shift+I/J/C
            if (e.ctrlKey && (e.keyCode == 85 || e.keyCode == 83)) return false; // Ctrl+U / Ctrl+S
        };

        // 3. Bloquear arrastre de imágenes (Ghost dragging)
        document.querySelectorAll('img').forEach(img => {
            img.setAttribute('draggable', 'false');
            img.addEventListener('dragstart', (e) => e.preventDefault());
        });

        // 4. Anti-Debugger Loop (Dificulta la inspección)
        // Nota: Esto pausará la consola si alguien intenta abrirla agresivamente.
        setInterval(() => {
            const start = performance.now();
            debugger;
            const end = performance.now();
            if (end - start > 100) {
                document.body.innerHTML = '<div style="background:black;color:red;height:100vh;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:2rem;">ACCESS DENIED /// SECURITY TRIGGERED</div>';
            }
        }, 4000);
        
        // Limpiar consola al inicio
        console.clear();
        console.log("%c OPIUM ARCHIVE %c SECURE CONNECTION ESTABLISHED ", "background: #000; color: #fff; font-size: 14px; padding: 5px;", "background: #ff0000; color: #000; font-size: 14px; padding: 5px; font-weight: bold;");
    };
    
    // Inicializar seguridad
    protectSystem();


    // ==========================================
    // ⚙️ CONFIGURACIÓN DEL SISTEMA
    // ==========================================
    const STORAGE_KEY_VOL = 'opium_vault_volume';
    const STORAGE_KEY_LANG = 'opium_vault_lang';
    const STORAGE_KEY_CACHE = 'opium_vault_cache_clean'; 
    const STORAGE_KEY_COOLDOWN = 'opium_ticket_timer'; 
    
    const CACHE_DURATION = 3600000; // 1 Hora
    const COOLDOWN_TIME = 30 * 60 * 1000; // 30 Minutos

    const COVER_ART_URL = 'assets/images/cover.jpg';
    
    // Audio silencioso para desbloqueo en móviles
    const SILENT_AUDIO = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTYXdmEgNS4xLjAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

    let state = {
        lang: localStorage.getItem(STORAGE_KEY_LANG) || 'en',
        volume: parseFloat(localStorage.getItem(STORAGE_KEY_VOL)) || 1.0,
        isPlaying: false,
        hasPlayedOnce: false,
        currentTrackIndex: -1,
        tracks: [] 
    };

    // --- LENGUAJE Y TEXTOS ---
    const translations = {
        en: {
            nav_home: "ARCHIVE", nav_about: "INFORMATION", 
            hero_title: "THE VAULT", hero_subtitle: "UNRELEASED AUDIO COLLECTION V.3",
            search_prompt: "SEARCH DATABASE", search_placeholder: "Type to search...", 
            col_track: "TRACK TITLE", col_year: "YEAR", col_size: "SIZE", col_action: "PLAY",
            about_title: "MANIFESTO", 
            about_p1: "An independent preservation project dedicated to unreleased auditory works. Curated for archival purposes only.", 
            about_p2: "All media is hosted on third-party servers. We do not claim ownership of these recordings. Respect the artist.",
            lbl_sync: "LAST UPDATE:", btn_ticket: "[ UPLOAD FILE ]",
            intro_btn: "ENTER ARCHIVE",
            player_idle: "READY TO PLAY", vol_label: "VOL", 
            no_results: "NO RESULTS FOUND",
            form_alias: "YOUR ALIAS / NAME *", form_msg: "LINK OR MESSAGE *", form_send: "SEND TRANSMISSION",
            form_sent: "UPLOAD SUCCESSFUL", 
            form_cd: "PLEASE WAIT BEFORE SENDING AGAIN", 
            form_sending: "SENDING DATA...", form_error: "TRANSMISSION FAILED",
            form_ph: "Secure links only (Mega, Dropbox, Drive)...",
            form_captcha_err: "VERIFICATION FAILED"
        },
        es: {
            nav_home: "ARCHIVO", nav_about: "INFORMACIÓN", 
            hero_title: "LA BÓVEDA", hero_subtitle: "COLECCIÓN DE AUDIO INÉDITO V.3",
            search_prompt: "BUSCAR EN BASE DE DATOS", search_placeholder: "Escribe para buscar...", 
            col_track: "TÍTULO", col_year: "AÑO", col_size: "TAMAÑO", col_action: "REPRODUCIR",
            about_title: "MANIFIESTO", 
            about_p1: "Proyecto de preservación independiente dedicado a obras auditivas inéditas. Curado exclusivamente con fines de archivo.", 
            about_p2: "Todo el contenido está alojado en servidores externos. No reclamamos la propiedad de estas grabaciones. Respetar al artista.",
            lbl_sync: "ÚLTIMA ACTUALIZACIÓN:", btn_ticket: "[ SUBIR ARCHIVO ]",
            intro_btn: "ENTRAR AL ARCHIVO",
            player_idle: "LISTO PARA REPRODUCIR", vol_label: "VOL", 
            no_results: "NO SE ENCONTRARON RESULTADOS",
            form_alias: "TU ALIAS / NOMBRE *", form_msg: "ENLACE O MENSAJE *", form_send: "ENVIAR TRANSMISIÓN",
            form_sent: "CARGA EXITOSA", 
            form_cd: "ESPERA ANTES DE ENVIAR DE NUEVO",
            form_sending: "ENVIANDO DATOS...", form_error: "ERROR DE TRANSMISIÓN",
            form_ph: "Solo enlaces seguros (Mega, Dropbox, Drive)...",
            form_captcha_err: "VERIFICACIÓN FALLIDA"
        }
    };

    // --- REFERENCIAS DOM ---
    const els = {
        audio: document.getElementById('audioElement'),
        trackList: document.getElementById('trackList'),
        playerContainer: document.querySelector('.player-container'),
        playBtn: document.getElementById('playBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        volSlider: document.getElementById('volumeSlider'),
        volContainer: document.querySelector('.p-volume'),
        progressBar: document.getElementById('progressBar'),
        progressContainer: document.getElementById('progressContainer'),
        searchInput: document.getElementById('searchInput'),
        trackTitle: document.getElementById('currentTrackTitle'),
        timeCurrent: document.getElementById('currentTime'),
        timeDuration: document.getElementById('duration'),
        secLeaks: document.getElementById('section-leaks'),
        secAbout: document.getElementById('section-about'),
        navHome: document.getElementById('nav-home'),
        navAbout: document.getElementById('nav-about'),
        langEn: document.getElementById('lang-en'),
        langEs: document.getElementById('lang-es'),
        sysClock: document.getElementById('systemClock'),
        openModalBtn: document.getElementById('openTicketModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        modal: document.getElementById('ticketModal'),
        ticketForm: document.getElementById('ticketForm'),
        ticketSubmitBtn: document.getElementById('ticketSubmitBtn'),
        successView: document.getElementById('successView'),
        formStatus: document.getElementById('formStatus'),
        splashScreen: document.getElementById('splashScreen'),
        enterArchiveBtn: document.getElementById('enterArchiveBtn'),
        mainContent: document.getElementById('mainContent')
    };

    // --- UTILIDADES ---
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    function parseFilename(filename) {
        let raw = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
        raw = raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        
        let year = 'N/A';
        const yearMatch = raw.match(/\b(20\d{2}|19\d{2})\b/);
        if (yearMatch) {
            year = yearMatch[0];
            raw = raw.replace(yearMatch[0], '').trim();
        }
        
        raw = raw.replace(/\(\s*\)|\[\s*\]/g, '').trim();
        
        let parts = raw.split(/\s-\s|\s-\s/);
        let artist = 'OPIUM ARCHIVE';
        let title = raw;
        
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' ').trim();
        } 
        return { artist: artist.toUpperCase(), title: title.toUpperCase(), year };
    }

    function formatBytes(bytes) {
        if (!+bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    function formatTime(s) {
        if(isNaN(s) || !isFinite(s)) return "00:00";
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec<10?'0'+sec:sec}`;
    }

    async function forceDownload(url, filename) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error("Download fallback triggered");
            window.open(url, '_blank');
        }
    }

    // --- CARGA DE DATOS ---
    async function loadData() {
        const cachedRaw = localStorage.getItem(STORAGE_KEY_CACHE);
        let validCache = false;

        // 1. Intentar caché
        if (cachedRaw) {
            try {
                const { timestamp, data } = JSON.parse(cachedRaw);
                // Si el caché tiene menos de 1 hora, usarlo
                if (Date.now() - timestamp < CACHE_DURATION) {
                    state.tracks = data;
                    renderTracks();
                    updateStatus("SYSTEM ONLINE");
                    return; 
                }
                state.tracks = data; 
                validCache = true;
            } catch(e) {
                localStorage.removeItem(STORAGE_KEY_CACHE);
            }
        }

        updateStatus("SYNCING DATABASE...");

        try {
            // 2. Intentar API
            const res = await fetch('https://api.github.com/repos/dxdnidknow/opium-archive-vault/contents/contents/leaks');
            
            if (!res.ok) {
                if(res.status === 403) throw new Error("RATE LIMIT EXCEEDED");
                throw new Error(`ACCESS DENIED (${res.status})`);
            }
            
            const files = await res.json();
            let trackId = 1;
            let tracks = [];

            if (Array.isArray(files)) {
                files.forEach(file => {
                    if (file.name.match(/\.(mp3|wav|m4a|flac)$/i)) {
                        const meta = parseFilename(file.name);
                        const audioUrl = `https://raw.githubusercontent.com/dxdnidknow/opium-archive-vault/main/contents/leaks/${encodeURIComponent(file.name)}`;

                        tracks.push({
                            id: trackId++,
                            title: meta.title,
                            artist: meta.artist,
                            year: meta.year,
                            size: formatBytes(file.size),
                            src: audioUrl,
                            filename: file.name
                        });
                    }
                });
            }

            state.tracks = tracks;
            localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({ timestamp: Date.now(), data: tracks }));
            
            renderTracks();
            updateStatus("SYSTEM ONLINE");

        } catch (e) {
            // 3. Fallback a caché antiguo si falla la API
            if (validCache) {
                console.warn("API Error, using cached data.");
                renderTracks();
                updateStatus("OFFLINE MODE");
            } else {
                updateStatus(`ERROR: ${e.message}`);
                if(els.trackList) els.trackList.innerHTML = `<li style="padding:20px; color:#ff0000; font-family:monospace; border:1px solid #333;">CONNECTION FAILED: ${e.message}</li>`;
            }
        }
    }

    function updateStatus(msg) {
        const el = document.querySelector('.status-online');
        if(el) el.innerHTML = `<span class="beacon"></span>${msg}`;
    }

    // --- RENDERIZADO ---
    function renderTracks(query = '') {
        if (!els.trackList) return;
        els.trackList.innerHTML = '';
        const q = query.toLowerCase();
        
        const filtered = state.tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));

        if (filtered.length === 0) {
            els.trackList.innerHTML = `<li style="padding:20px; color:#555; font-style:italic;">${translations[state.lang].no_results}</li>`;
            return;
        }

        const frag = document.createDocumentFragment();
        filtered.forEach(track => {
            const realIndex = state.tracks.findIndex(x => x.id === track.id);
            const isActive = realIndex === state.currentTrackIndex;
            const li = document.createElement('li');
            li.className = `track-item hover-trigger ${isActive ? 'active-track' : ''}`;
            
            // ID
            const divId = document.createElement('div');
            divId.className = 't-id';
            if (isActive) {
                divId.innerHTML = '<span class="playing-indicator"></span>';
            } else {
                const idxSpan = document.createElement('span');
                idxSpan.className = 'index-num';
                idxSpan.textContent = track.id < 10 ? '0'+track.id : track.id;
                divId.appendChild(idxSpan);
            }
            li.appendChild(divId);

            // Info
            const divInfo = document.createElement('div');
            divInfo.className = 't-info';
            const spanTitle = document.createElement('span');
            spanTitle.className = 't-title';
            spanTitle.textContent = track.title;
            const spanArtist = document.createElement('span');
            spanArtist.className = 't-artist';
            spanArtist.textContent = track.artist;
            divInfo.appendChild(spanTitle);
            divInfo.appendChild(spanArtist);
            li.appendChild(divInfo);

            // Metadata
            const divYear = document.createElement('div');
            divYear.className = 't-meta hide-mobile';
            divYear.textContent = track.year;
            li.appendChild(divYear);

            const divSize = document.createElement('div');
            divSize.className = 't-meta hide-mobile';
            divSize.textContent = track.size;
            li.appendChild(divSize);

            // Acciones
            const divActions = document.createElement('div');
            divActions.className = 'col-actions';
            
            const btnPlay = document.createElement('button');
            btnPlay.className = 'icon-btn play-trigger';
            btnPlay.dataset.index = realIndex;
            btnPlay.textContent = isActive && state.isPlaying ? '❚❚' : '▶';
            
            const btnDown = document.createElement('button');
            btnDown.className = 'icon-btn download-trigger';
            btnDown.innerHTML = '&darr;'; 
            btnDown.onclick = (e) => {
                e.stopPropagation();
                forceDownload(track.src, track.filename || `${track.artist} - ${track.title}.mp3`);
            };

            divActions.appendChild(btnPlay);
            divActions.appendChild(btnDown);
            li.appendChild(divActions);

            frag.appendChild(li);
        });
        els.trackList.appendChild(frag);
    }

    // --- REPRODUCTOR ---
    async function loadTrack(index) {
        if (state.tracks.length === 0) return;
        
        if (index >= state.tracks.length) index = 0;
        if (index < 0) index = state.tracks.length - 1; 
        
        state.currentTrackIndex = index;
        const track = state.tracks[index];
        els.trackTitle.innerText = `${track.artist} - ${track.title}`;
        
        if (!track.src) return;
        
        els.audio.src = track.src;

        if(!state.hasPlayedOnce) {
            state.hasPlayedOnce = true;
            els.playerContainer.classList.add('visible');
        }
        renderTracks(els.searchInput.value); 
        
        try {
            const playPromise = els.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => { 
                    state.isPlaying = true; 
                    updatePlayBtn(true);
                    updateMediaSession(track);
                })
                .catch((err) => { 
                    state.isPlaying = false; 
                    updatePlayBtn(false); 
                });
            }
        } catch (err) {}
    }

    function updateMediaSession(track) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                album: "THE VAULT ARCHIVE",
                artwork: [
                    { src: COVER_ART_URL, sizes: '512x512', type: 'image/jpeg' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', togglePlay);
            navigator.mediaSession.setActionHandler('previoustrack', () => loadTrack(state.currentTrackIndex - 1));
            navigator.mediaSession.setActionHandler('nexttrack', () => loadTrack(state.currentTrackIndex + 1));
        }
    }

    function togglePlay() {
        if (state.currentTrackIndex === -1 && state.tracks.length > 0) { loadTrack(0); return; }
        if(els.audio.paused) { 
            els.audio.play().then(() => { 
                state.isPlaying = true; 
                updatePlayBtn(true); 
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
            }).catch(() => { state.isPlaying = false; updatePlayBtn(false); }); 
        } else { 
            els.audio.pause(); 
            state.isPlaying = false; 
            updatePlayBtn(false); 
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
        }
    }

    function updatePlayBtn(playing) { 
        els.playBtn.innerHTML = playing ? '❚❚' : '<span class="play-icon">▶</span>'; 
        renderTracks(els.searchInput.value); 
    }

    // --- CONTROLES ---
    document.addEventListener('keydown', (e) => {
        // Ignorar atajos si el usuario escribe en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.code) {
            case 'Space': e.preventDefault(); togglePlay(); break;
            case 'ArrowRight': if (!isNaN(els.audio.duration)) els.audio.currentTime = Math.min(els.audio.duration, els.audio.currentTime + 5); break;
            case 'ArrowLeft': if (!isNaN(els.audio.duration)) els.audio.currentTime = Math.max(0, els.audio.currentTime - 5); break;
            case 'ArrowUp': e.preventDefault(); els.audio.volume = Math.min(els.audio.volume + 0.05, 1); if(els.volSlider) els.volSlider.value = els.audio.volume; break;
            case 'ArrowDown': e.preventDefault(); els.audio.volume = Math.max(els.audio.volume - 0.05, 0); if(els.volSlider) els.volSlider.value = els.audio.volume; break;
        }
    });

    els.audio.addEventListener('ended', () => { state.isPlaying = false; updatePlayBtn(false); });
    els.playBtn.addEventListener('click', togglePlay);
    els.nextBtn.addEventListener('click', () => loadTrack(state.currentTrackIndex + 1));
    els.prevBtn.addEventListener('click', () => loadTrack(state.currentTrackIndex - 1));

    if(els.volSlider) {
        els.volSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            els.audio.volume = val; state.volume = val;
            localStorage.setItem(STORAGE_KEY_VOL, val);
        });
        els.volSlider.value = state.volume; els.audio.volume = state.volume;
    }
    
    // --- SCRUBBING ---
    let isDragging = false;
    els.audio.addEventListener('timeupdate', () => {
        if (!isDragging && !isNaN(els.audio.duration)) {
            const pct = (els.audio.currentTime / els.audio.duration) * 100;
            els.progressBar.style.width = `${pct}%`;
            els.timeCurrent.innerText = formatTime(els.audio.currentTime);
            els.timeDuration.innerText = formatTime(els.audio.duration);
        }
    });
    
    const updateScrub = (clientX) => {
        if (isNaN(els.audio.duration)) return;
        const rect = els.progressContainer.getBoundingClientRect();
        let pos = (clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        els.progressBar.style.width = `${pos * 100}%`;
        els.timeCurrent.innerText = formatTime(pos * els.audio.duration);
        return pos * els.audio.duration;
    };
    
    els.progressContainer.addEventListener('mousedown', (e) => { isDragging = true; updateScrub(e.clientX); });
    document.addEventListener('mousemove', (e) => { if (isDragging) { e.preventDefault(); updateScrub(e.clientX); } });
    document.addEventListener('mouseup', (e) => { if (isDragging) { const t = updateScrub(e.clientX); if(t !== undefined) els.audio.currentTime = t; isDragging = false; } });
    
    // Touch events
    els.progressContainer.addEventListener('touchstart', (e) => { isDragging = true; updateScrub(e.touches[0].clientX); }, {passive: false});
    document.addEventListener('touchmove', (e) => { if (isDragging) { e.preventDefault(); updateScrub(e.touches[0].clientX); } }, {passive: false});
    document.addEventListener('touchend', (e) => { if (isDragging) { const t = updateScrub(e.changedTouches[0].clientX); if(t !== undefined) els.audio.currentTime = t; isDragging = false; } });

    if(els.trackList) {
        els.trackList.addEventListener('click', (e) => {
            const btn = e.target.closest('.play-trigger');
            if(btn) {
                const idx = parseInt(btn.dataset.index);
                state.currentTrackIndex === idx ? togglePlay() : loadTrack(idx);
            }
        });
    }

    els.searchInput.addEventListener('input', debounce((e) => { renderTracks(e.target.value); }, 300));

    // --- NAVEGACIÓN ---
    function switchSection(sec) {
        if (sec === 'leaks') {
            els.secLeaks.classList.remove('hidden'); els.secAbout.classList.add('hidden');
            els.navHome.classList.add('active'); els.navAbout.classList.remove('active');
        } else if (sec === 'about') {
            els.secLeaks.classList.add('hidden'); els.secAbout.classList.remove('hidden');
            els.navHome.classList.remove('active'); els.navAbout.classList.add('active');
        }
    }
    els.navHome.addEventListener('click', (e) => { e.preventDefault(); switchSection('leaks'); });
    els.navAbout.addEventListener('click', (e) => { e.preventDefault(); switchSection('about'); });

    // --- IDIOMA ---
    function setLang(lang) {
        state.lang = lang;
        localStorage.setItem(STORAGE_KEY_LANG, lang);
        
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => el.classList.add('text-scramble'));

        setTimeout(() => {
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key === 'player_idle' && state.currentTrackIndex !== -1) {
                    // No hacer nada si está sonando
                } else {
                    if (translations[lang][key]) el.innerText = translations[lang][key];
                }
                el.classList.remove('text-scramble');
            });

            if (els.searchInput) els.searchInput.placeholder = translations[lang].search_placeholder;
            
            els.langEn.classList.remove('active');
            els.langEs.classList.remove('active');
            document.getElementById(`lang-${lang}`).classList.add('active');
            renderTracks(els.searchInput.value);
        }, 300);
    }
    
    els.langEn.addEventListener('click', () => setLang('en'));
    els.langEs.addEventListener('click', () => setLang('es'));

    // --- MODAL ---
    els.openModalBtn.addEventListener('click', () => { 
        els.modal.classList.remove('hidden');
        setTimeout(() => els.modal.classList.add('open'), 10);
        els.ticketForm.style.display = 'block'; els.successView.style.display = 'none';
        const lastSent = localStorage.getItem(STORAGE_KEY_COOLDOWN);
        if(lastSent && (Date.now() - parseInt(lastSent) < COOLDOWN_TIME)) els.ticketSubmitBtn.disabled = true;
        else els.ticketSubmitBtn.disabled = false;
    });
    els.closeModalBtn.addEventListener('click', () => { els.modal.classList.remove('open'); setTimeout(() => els.modal.classList.add('hidden'), 300); });
    
    ['alias', 'message'].forEach(id => {
        const el = document.getElementById(id);
        const st = document.getElementById(id === 'alias' ? 'aliasStatus' : 'msgStatus');
        if(el && st) el.addEventListener('input', () => { 
            st.innerText = `LENGTH: ${el.value.length}`; 
            if(el.value.length < el.minLength) st.classList.add('invalid'); else st.classList.remove('invalid');
        });
    });

    els.ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(typeof grecaptcha !== 'undefined' && !grecaptcha.getResponse()) { 
            els.formStatus.innerText = translations[state.lang].form_captcha_err; return; 
        }
        
        els.ticketSubmitBtn.disabled = true;
        els.formStatus.innerText = translations[state.lang].form_sending;

        try {
            const res = await fetch(els.ticketForm.action, { 
                method: 'POST', 
                body: JSON.stringify(Object.fromEntries(new FormData(els.ticketForm).entries())), 
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } 
            });
            
            if(res.ok) { 
                localStorage.setItem(STORAGE_KEY_COOLDOWN, Date.now()); 
                els.ticketForm.style.display = 'none'; 
                els.successView.style.display = 'flex'; 
                if(typeof grecaptcha !== 'undefined') grecaptcha.reset(); 
                setTimeout(() => { 
                    els.modal.classList.remove('open'); 
                    setTimeout(() => els.modal.classList.add('hidden'), 300); 
                }, 2500); 
            } else { 
                els.formStatus.innerText = translations[state.lang].form_error; 
                els.ticketSubmitBtn.disabled = false; 
                if(typeof grecaptcha !== 'undefined') grecaptcha.reset(); 
            }
        } catch(err) { 
            els.formStatus.innerText = "NETWORK ERROR"; 
            els.ticketSubmitBtn.disabled = false; 
            if(typeof grecaptcha !== 'undefined') grecaptcha.reset(); 
        }
    });

    // --- ENTRADA (SPLASH) ---
    els.enterArchiveBtn.addEventListener('click', () => {
        els.splashScreen.style.opacity = '0';
        setTimeout(() => els.splashScreen.classList.add('hidden'), 500);
        els.mainContent.classList.remove('hidden');
        
        els.audio.src = SILENT_AUDIO; 
        els.audio.play().catch(() => {});
        
        loadData();
    });

    // RELOJ
    setInterval(() => { if(els.sysClock) els.sysClock.innerText = new Date().toISOString().replace('T', ' ').split('.')[0] + " UTC"; }, 1000);
    
    // INICIO
    setLang(state.lang);

    // --- TÍTULO INTERACTIVO ---
    const originalTitle = document.title;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = "WAITING...";
        } else {
            document.title = originalTitle;
        }
    });
});