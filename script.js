document.addEventListener('DOMContentLoaded', () => {
    
    // CONFIGURACIÓN
    const STORAGE_KEY_VOL = 'opium_vault_volume';
    const STORAGE_KEY_LANG = 'opium_vault_lang';
    const STORAGE_KEY_CACHE = 'opium_vault_data_cache_v3_cdn'; // Cache key updated
    const STORAGE_KEY_COOLDOWN = 'opium_ticket_timer'; 
    
    const CACHE_DURATION = 3600000; 
    const COOLDOWN_TIME = 30 * 60 * 1000; // 30 Minutos

    const SILENT_AUDIO = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTYXdmEgNS4xLjAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

    let state = {
        lang: localStorage.getItem(STORAGE_KEY_LANG) || 'en',
        volume: parseFloat(localStorage.getItem(STORAGE_KEY_VOL)) || 1.0,
        isPlaying: false,
        hasPlayedOnce: false,
        currentTrackIndex: -1,
        tracks: [] 
    };

    const translations = {
        en: {
            nav_home: "[HOME]", nav_about: "[ABOUT]", 
            hero_title: "THE VAULT", hero_subtitle: "/// UNRELEASED AUDIO ARCHIVE V.3.0",
            search_prompt: "> QUERY:", search_placeholder: "SEARCH...", 
            col_track: "TRACK NAME", col_year: "YEAR", col_size: "SIZE", col_action: "ACT",
            about_title: "/// PROJECT MANIFESTO", 
            about_p1: "THE ARCHIVE IS A DIGITAL SANCTUARY DEDICATED TO THE PRESERVATION OF RARE AUDITORY ARTIFACTS FROM THE OPIUM ERA.", 
            about_p2: "WE DO NOT OWN THE RIGHTS TO THESE RECORDINGS. THIS IS A NON-PROFIT FAN INITIATIVE.",
            lbl_sync: "> LAST SYNC:", btn_ticket: "[ SUBMIT TICKET ]",
            intro_btn: "[ ENTER ARCHIVE ]",
            player_idle: "NO ACTIVE SIGNAL", vol_label: "VOL", 
            no_results: "NO DATA FOUND IN ARCHIVE...",
            form_alias: "ALIAS / CODENAME *", form_msg: "MESSAGE / LINK *", form_send: "[ SEND DATA ]",
            form_sent: "/// TRANSMISSION SENT ///", 
            form_cd: "/// SYSTEM COOLDOWN ///", 
            form_sending: "TRANSMITTING...", form_error: "> SYSTEM ERROR",
            form_ph: "PASTE LINKS HERE...",
            form_captcha_err: "> VERIFICATION FAILED"
        },
        es: {
            nav_home: "[INICIO]", nav_about: "[ACERCA]", 
            hero_title: "LA BÓVEDA", hero_subtitle: "/// ARCHIVO DE AUDIO INÉDITO V.3.0",
            search_prompt: "> BÚSQUEDA:", search_placeholder: "BUSCAR...", 
            col_track: "NOMBRE PISTA", col_year: "AÑO", col_size: "TAMAÑO", col_action: "CMD",
            about_title: "/// MANIFIESTO DEL PROYECTO", 
            about_p1: "SANTUARIO DIGITAL PARA LA PRESERVACIÓN DE ARTEFACTOS AUDITIVOS DE LA ERA OPIUM.", 
            about_p2: "NO POSEEMOS LOS DERECHOS DE ESTAS GRABACIONES. ESTA ES UNA INICIATIVA DE FANS SIN FINES DE LUCRO.",
            lbl_sync: "> ULT. SINC:", btn_ticket: "[ ENVIAR TICKET ]",
            intro_btn: "[ INICIAR SISTEMA ]",
            player_idle: "SIN SEÑAL ACTIVA", vol_label: "VOL", 
            no_results: "NO SE ENCONTRARON DATOS...",
            form_alias: "ALIAS / CÓDIGO *", form_msg: "MENSAJE / ENLACE *", form_send: "[ ENVIAR DATOS ]",
            form_sent: "/// TRANSMISIÓN ENVIADA ///", 
            form_cd: "/// ENFRIAMIENTO DE SISTEMA ///",
            form_sending: "TRANSMITIENDO...", form_error: "> ERROR DEL SISTEMA",
            form_ph: "PEGAR ENLACES AQUÍ...",
            form_captcha_err: "> VERIFICACIÓN FALLIDA"
        }
    };

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

    // UTILS
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    function parseFilename(filename) {
        let raw = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
        // Clean underscores and extra spaces
        raw = raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        
        let year = 'N/A';
        // Extract Year (e.g., 2021)
        const yearMatch = raw.match(/\b(20\d{2}|19\d{2})\b/);
        if (yearMatch) {
            year = yearMatch[0];
            raw = raw.replace(yearMatch[0], '').trim();
        }
        
        // Remove parenthesis and brackets
        raw = raw.replace(/\(\s*\)|\[\s*\]/g, '').trim();
        
        let parts = raw.split(/\s-\s|\s-\s/);
        let artist = 'OPIUM ARCHIVE';
        let title = raw;
        
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' ').trim();
        } else {
            const knownArtists = ['CARTI', 'KEN', 'CARSON', 'DESTROY', 'LONELY', 'HOMIXIDE', 'PLAYBOI'];
            for(let k of knownArtists) {
                if(raw.toUpperCase().startsWith(k)) {
                    // Try to find the first space after the artist name might be tricky 
                    // with multi-word artists, but splitting by ' - ' is safer.
                    // If no hyphen, we keep the raw string as title or artist based on context
                    break; 
                }
            }
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

    // --- COOLDOWN LOGIC ---
    function checkCooldown() {
        const lastSent = localStorage.getItem(STORAGE_KEY_COOLDOWN);
        if(!lastSent) return { active: false };

        const now = Date.now();
        const diff = now - parseInt(lastSent);
        
        if (diff < COOLDOWN_TIME) {
            const remainingMins = Math.ceil((COOLDOWN_TIME - diff) / 60000);
            return { active: true, remaining: remainingMins };
        }
        return { active: false };
    }

    function updateSubmitButtonState() {
        if(!els.ticketSubmitBtn) return; 
        
        const cooldown = checkCooldown();
        const btnText = els.ticketSubmitBtn.querySelector('.btn-text');
        
        if (cooldown.active) {
            els.ticketSubmitBtn.disabled = true;
            btnText.innerText = `${translations[state.lang].form_cd} (${cooldown.remaining}M)`;
            els.formStatus.innerText = `WAIT ${cooldown.remaining} MIN BEFORE SENDING AGAIN.`;
        } else {
            els.ticketSubmitBtn.disabled = false;
            btnText.innerText = translations[state.lang].form_send;
            els.formStatus.innerText = "";
        }
    }

    // --- INPUT VALIDATION SYSTEM ---
    function initInputValidation() {
        const inputs = [
            { id: 'alias', min: 4, max: 20, status: document.getElementById('aliasStatus') },
            { id: 'message', min: 20, max: 400, status: document.getElementById('msgStatus') }
        ];

        inputs.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;

            el.addEventListener('input', () => {
                const len = el.value.length;
                
                // Actualizar texto status
                if(field.status) {
                    field.status.innerText = `> LEN: ${len} / ${field.max}`;

                    // Validar longitud mínima visualmente
                    if (len > 0 && len < field.min) {
                        field.status.innerText += ` [MIN: ${field.min}]`;
                        field.status.classList.add('invalid');
                        field.status.classList.remove('valid');
                        el.style.borderColor = 'var(--accent-red)';
                    } else if (len >= field.min) {
                        field.status.classList.remove('invalid');
                        field.status.classList.add('valid');
                        el.style.borderColor = '#333'; // Reset border
                    } else {
                        // Estado vacío
                        field.status.classList.remove('invalid', 'valid');
                        el.style.borderColor = '#333';
                    }
                }
            });
        });
    }

    // --- DATA LOADING (CDN MODE) ---
    async function loadData() {
        const cachedRaw = localStorage.getItem(STORAGE_KEY_CACHE);
        
        // Cache Logic (Optional: Uncomment for production speed)
        /*
        if (cachedRaw) {
            try {
                const { timestamp, data } = JSON.parse(cachedRaw);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    state.tracks = data;
                    renderTracks();
                    updateStatus("ONLINE // CACHED");
                    return;
                }
            } catch(e) {
                localStorage.removeItem(STORAGE_KEY_CACHE);
            }
        }
        */

        try {
            // Fetch file list from GitHub REPO (not Releases)
            const res = await fetch('https://api.github.com/repos/dxdnidknow/opium-archive-vault/contents/leaks');
            
            if (!res.ok) {
                if(res.status === 403) throw new Error("API LIMIT EXCEEDED");
                throw new Error(`REPO ACCESS DENIED (${res.status})`);
            }
            
            const files = await res.json();
            let trackId = 1;
            let tracks = [];

            if (Array.isArray(files)) {
                files.forEach(file => {
                    if (file.name.match(/\.(mp3|wav|m4a|flac)$/i)) {
                        const meta = parseFilename(file.name);
                        
                        // JSDelivr CDN Link Construction
                        // This fixes iPhone/Safari MIME type issues
                        const cdnUrl = `https://cdn.jsdelivr.net/gh/dxdnidknow/opium-archive-vault/leaks/${encodeURIComponent(file.name)}`;

                        tracks.push({
                            id: trackId++,
                            title: meta.title,
                            artist: meta.artist,
                            year: meta.year,
                            size: formatBytes(file.size),
                            src: cdnUrl 
                        });
                    }
                });
            }

            state.tracks = tracks;
            localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({ timestamp: Date.now(), data: tracks }));
            renderTracks();
            updateStatus("ONLINE // CDN_LINK");

        } catch (e) {
            updateStatus(`OFFLINE // ${e.message}`);
            if(els.trackList) els.trackList.innerHTML = `<li style="padding:20px; color:#ff0000; border:1px solid red;">> ERROR: ${e.message}</li>`;
            console.error(e);
        }
    }

    function updateStatus(msg) {
        const el = document.querySelector('.status-online');
        if(el) el.innerHTML = `<span class="beacon"></span>${msg}`;
    }

    function renderTracks(query = '') {
        if (!els.trackList) return;
        els.trackList.innerHTML = '';
        const q = query.toLowerCase();
        const filtered = state.tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));

        if (filtered.length === 0) {
            els.trackList.innerHTML = `<li style="padding:20px; color:#555;">${translations[state.lang].no_results}</li>`;
            return;
        }

        const frag = document.createDocumentFragment();
        filtered.forEach(track => {
            const realIndex = state.tracks.findIndex(x => x.id === track.id);
            const isActive = realIndex === state.currentTrackIndex;
            const li = document.createElement('li');
            li.className = `track-item hover-trigger ${isActive ? 'active-track' : ''}`;
            
            // SECURITY: Using DOM creation instead of InnerHTML to prevent XSS
            
            // ID Column
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

            // Info Column
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

            // Meta Columns
            const divYear = document.createElement('div');
            divYear.className = 't-meta hide-mobile';
            divYear.textContent = track.year;
            li.appendChild(divYear);

            const divSize = document.createElement('div');
            divSize.className = 't-meta hide-mobile';
            divSize.textContent = track.size;
            li.appendChild(divSize);

            // Actions Column
            const divActions = document.createElement('div');
            divActions.className = 'col-actions';
            
            const btnPlay = document.createElement('button');
            btnPlay.className = 'icon-btn play-trigger';
            btnPlay.dataset.index = realIndex;
            btnPlay.textContent = isActive && state.isPlaying ? '❚❚' : '▶';
            
            const btnDown = document.createElement('a');
            btnDown.href = track.src;
            btnDown.className = 'icon-btn';
            btnDown.target = '_blank';
            btnDown.textContent = '↓';
            btnDown.download = '';

            divActions.appendChild(btnPlay);
            divActions.appendChild(btnDown);
            li.appendChild(divActions);

            frag.appendChild(li);
        });
        els.trackList.appendChild(frag);
    }

    async function loadTrack(index) {
        if (state.tracks.length === 0) return;
        if (index >= state.tracks.length) index = 0;
        if (index < 0) index = state.tracks.length - 1; 
        
        state.currentTrackIndex = index;
        const track = state.tracks[index];
        els.trackTitle.innerText = `${track.artist} - ${track.title}`;
        
        if (!track.src) return;
        
        // SAFARI FIX: Direct src assignment, NO explicit .load()
        els.audio.src = track.src;

        if(!state.hasPlayedOnce) {
            state.hasPlayedOnce = true;
            els.playerContainer.classList.add('visible');
        }
        renderTracks(els.searchInput.value);
        
        try {
            // SAFARI FIX: Handle Play Promise
            const playPromise = els.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    state.isPlaying = true;
                    updatePlayBtn(true);
                }).catch(error => {
                    console.warn("Auto-play prevented (User interaction needed or buffering):", error);
                    state.isPlaying = false;
                    updatePlayBtn(false);
                });
            }
        } catch (err) {
            console.error("Critical Audio Error:", err);
            state.isPlaying = false;
            updatePlayBtn(false);
        }
    }

    function togglePlay() {
        if (state.currentTrackIndex === -1 && state.tracks.length > 0) {
            loadTrack(0);
            return;
        }
        if(els.audio.paused) {
            els.audio.play().then(() => { state.isPlaying = true; updatePlayBtn(true); }).catch(() => { state.isPlaying = false; updatePlayBtn(false); });
        } else {
            els.audio.pause();
            state.isPlaying = false;
            updatePlayBtn(false);
        }
    }

    function updatePlayBtn(playing) {
        els.playBtn.innerHTML = playing ? '❚❚' : '<span class="play-icon">▶</span>';
        renderTracks(els.searchInput.value); 
    }

    // --- KEYBOARD CONTROLS (YOUTUBE STYLE) ---
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in Search or Ticket form
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.code) {
            case 'Space':
                e.preventDefault(); // Prevent page scroll
                togglePlay();
                break;
            case 'ArrowRight':
                if (!isNaN(els.audio.duration)) {
                    e.preventDefault();
                    els.audio.currentTime = Math.min(els.audio.duration, els.audio.currentTime + 5);
                }
                break;
            case 'ArrowLeft':
                if (!isNaN(els.audio.duration)) {
                    e.preventDefault();
                    els.audio.currentTime = Math.max(0, els.audio.currentTime - 5);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                const newVolUp = Math.min(els.audio.volume + 0.05, 1);
                els.audio.volume = newVolUp;
                if(els.volSlider) els.volSlider.value = newVolUp;
                localStorage.setItem(STORAGE_KEY_VOL, newVolUp);
                break;
            case 'ArrowDown':
                e.preventDefault();
                const newVolDown = Math.max(els.audio.volume - 0.05, 0);
                els.audio.volume = newVolDown;
                if(els.volSlider) els.volSlider.value = newVolDown;
                localStorage.setItem(STORAGE_KEY_VOL, newVolDown);
                break;
        }
    });

    // --- EVENTS & CONTROL LOGIC ---

    // 1. PLAYBACK END/ERROR
    els.audio.addEventListener('ended', () => {
        // DISABLE AUTO-NEXT. STOP AT END.
        state.isPlaying = false;
        updatePlayBtn(false);
    });
    
    els.audio.addEventListener('error', () => {
        if(state.tracks.length > 1 && state.currentTrackIndex !== -1) {
            // Only retry if it's not a complete failure of the list
            console.error("Audio Load Error");
        }
    });

    // 2. BUTTONS
    els.playBtn.addEventListener('click', togglePlay);
    els.nextBtn.addEventListener('click', () => loadTrack(state.currentTrackIndex + 1));
    els.prevBtn.addEventListener('click', () => loadTrack(state.currentTrackIndex - 1));

    // 3. VOLUME CONTROL (INPUT + SCROLL WHEEL)
    if(els.volSlider) {
        // Standard Slider Input
        els.volSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            els.audio.volume = val;
            state.volume = val; // Sync State
            localStorage.setItem(STORAGE_KEY_VOL, val);
        });
        // Initial State
        els.volSlider.value = state.volume;
        els.audio.volume = state.volume;
    }

    // Scroll Wheel Override for Volume
    if (els.volContainer) {
        els.volContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const step = 0.05;
            let newVol = els.audio.volume;

            if (e.deltaY < 0) { // Scrolling Up
                newVol = Math.min(newVol + step, 1);
            } else { // Scrolling Down
                newVol = Math.max(newVol - step, 0);
            }

            els.audio.volume = newVol;
            if(els.volSlider) els.volSlider.value = newVol;
            state.volume = newVol;
            localStorage.setItem(STORAGE_KEY_VOL, newVol);
        }, { passive: false });
    }

    // 4. SCRUBBING SYSTEM (DRAG & DROP)
    let isDragging = false;

    // Time Update (Visual Only if NOT Dragging)
    els.audio.addEventListener('timeupdate', () => {
        if (!isDragging && !isNaN(els.audio.duration)) {
            const pct = (els.audio.currentTime / els.audio.duration) * 100;
            els.progressBar.style.width = `${pct}%`;
            els.timeCurrent.innerText = formatTime(els.audio.currentTime);
            els.timeDuration.innerText = formatTime(els.audio.duration);
        }
    });

    // Helper to calculate position
    const updateScrub = (clientX) => {
        if (isNaN(els.audio.duration)) return;
        const rect = els.progressContainer.getBoundingClientRect();
        // Limit pos between 0 and 1
        let pos = (clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        
        // Immediate visual update
        els.progressBar.style.width = `${pos * 100}%`;
        els.timeCurrent.innerText = formatTime(pos * els.audio.duration);
        
        return pos * els.audio.duration;
    };

    // MOUSE EVENTS
    els.progressContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateScrub(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault(); 
            updateScrub(e.clientX);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            const newTime = updateScrub(e.clientX);
            if(newTime !== undefined) els.audio.currentTime = newTime;
            isDragging = false;
        }
    });

    // TOUCH EVENTS (Mobile Scrubbing)
    els.progressContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateScrub(e.touches[0].clientX);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault(); // Prevent scroll while seeking
            updateScrub(e.touches[0].clientX);
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (isDragging) {
            const newTime = updateScrub(e.changedTouches[0].clientX);
            if(newTime !== undefined) els.audio.currentTime = newTime;
            isDragging = false;
        }
    });

    if(els.trackList) {
        els.trackList.addEventListener('click', (e) => {
            const btn = e.target.closest('.play-trigger');
            if(btn) {
                const idx = parseInt(btn.dataset.index);
                state.currentTrackIndex === idx ? togglePlay() : loadTrack(idx);
            }
        });
    }

    // PERFORMANCE: DEBOUNCE SEARCH
    els.searchInput.addEventListener('input', debounce((e) => {
        renderTracks(e.target.value);
    }, 300));

    // --- NAVIGATION & LANG ---
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

    function setLang(lang) {
        state.lang = lang;
        localStorage.setItem(STORAGE_KEY_LANG, lang);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) el.innerText = translations[lang][key];
        });
        if (els.searchInput) {
            els.searchInput.placeholder = translations[lang].search_placeholder;
            const msgInput = document.getElementById('message');
            if(msgInput) msgInput.placeholder = translations[lang].form_ph;
        }
        els.langEn.classList.remove('active');
        els.langEs.classList.remove('active');
        document.getElementById(`lang-${lang}`).classList.add('active');
        
        if(els.ticketSubmitBtn && els.ticketSubmitBtn.disabled) updateSubmitButtonState();
        renderTracks(els.searchInput.value);
    }
    
    els.langEn.addEventListener('click', () => setLang('en'));
    els.langEs.addEventListener('click', () => setLang('es'));

    // --- APP INIT ---
    els.enterArchiveBtn.addEventListener('click', () => {
        els.splashScreen.style.opacity = '0';
        setTimeout(() => els.splashScreen.classList.add('hidden'), 500);
        els.mainContent.classList.remove('hidden');
        els.audio.src = SILENT_AUDIO;
        els.audio.play().catch(() => {});
        loadData();
    });

    // --- MODAL & FORM LOGIC ---
    els.openModalBtn.addEventListener('click', () => { 
        els.modal.classList.remove('hidden');
        setTimeout(() => els.modal.classList.add('open'), 10);
        
        // Reset vistas
        els.ticketForm.style.display = 'block';
        els.successView.style.display = 'none';
        
        // Checar Cooldown
        updateSubmitButtonState();
    });
    
    els.closeModalBtn.addEventListener('click', () => {
        els.modal.classList.remove('open');
        setTimeout(() => els.modal.classList.add('hidden'), 300);
    });

    els.ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if(checkCooldown().active) return;

        // VERIFY CAPTCHA
        const captchaResponse = grecaptcha.getResponse();
        if(captchaResponse.length === 0) {
             els.formStatus.innerText = translations[state.lang].form_captcha_err;
             return;
        }

        const btnText = els.ticketSubmitBtn.querySelector('.btn-text');
        const originalText = translations[state.lang].form_send;
        
        btnText.innerText = translations[state.lang].form_sending;
        els.ticketSubmitBtn.disabled = true;
        els.formStatus.innerText = "";
        
        const formData = new FormData(els.ticketForm);
        // Ensure recaptcha response is included (Formspree checks 'g-recaptcha-response')
        const jsonData = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(els.ticketForm.action, {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            const data = await response.json();

            if (response.ok) {
                // ACTIVAR COOLDOWN
                localStorage.setItem(STORAGE_KEY_COOLDOWN, Date.now());

                // MOSTRAR ANIMACIÓN DE ÉXITO
                els.ticketForm.style.display = 'none';
                els.successView.style.display = 'flex';
                els.ticketForm.reset();
                grecaptcha.reset(); // Reset captcha for next use

                setTimeout(() => {
                    els.modal.classList.remove('open');
                    setTimeout(() => els.modal.classList.add('hidden'), 300);
                }, 2500);

            } else {
                console.error("Formspree Error:", data);
                els.formStatus.innerText = data.errors ? data.errors.map(err => err.message).join(", ") : "ACCESS DENIED";
                els.ticketSubmitBtn.disabled = false;
                btnText.innerText = originalText;
                grecaptcha.reset();
            }
        } catch (error) {
            console.error("Network Error:", error);
            els.formStatus.innerText = translations[state.lang].form_error;
            els.ticketSubmitBtn.disabled = false;
            btnText.innerText = originalText;
            grecaptcha.reset();
        }
    });

    // Initialize Input Validation
    initInputValidation();

    setInterval(() => {
        const now = new Date();
        if(els.sysClock) els.sysClock.innerText = `${now.toISOString().split('T')[0]} // ${now.toUTCString().split(' ')[4]} UTC`;
    }, 1000);

    setLang(state.lang);
});