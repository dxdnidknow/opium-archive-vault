document.addEventListener('DOMContentLoaded', () => {
    
    const STORAGE_KEY_VOL = 'opium_vault_volume';
    const STORAGE_KEY_LANG = 'opium_vault_lang';
    const STORAGE_KEY_COOLDOWN = 'opium_ticket_cooldown';
    const COOLDOWN_TIME = 15 * 60 * 1000;
    
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
            form_sent: "/// TRANSMISSION SENT ///", form_cd: "/// SYSTEM COOLDOWN: WAIT 15 MIN ///",
            form_sending: "SENDING...", form_error: "> SYSTEM ERROR",
            form_ph: "PASTE LINKS HERE..."
        },
        es: {
            nav_home: "[INICIO]", nav_about: "[ACERCA]", 
            hero_title: "LA BÓVEDA", hero_subtitle: "/// ARCHIVO DE AUDIO INÉDITO V.3.0",
            search_prompt: "> BÚSQUEDA:", search_placeholder: "BUSCAR...", 
            col_track: "NOMBRE PISTA", col_year: "AÑO", col_size: "PESO", col_action: "CMD",
            about_title: "/// MANIFIESTO DEL PROYECTO", 
            about_p1: "SANTUARIO DIGITAL PARA LA PRESERVACIÓN DE ARTEFACTOS AUDITIVOS DE LA ERA OPIUM.", 
            about_p2: "NO POSEEMOS LOS DERECHOS DE ESTAS GRABACIONES. ESTA ES UNA INICIATIVA DE FANS SIN FINES DE LUCRO.",
            lbl_sync: "> ULT. SINC:", btn_ticket: "[ ENVIAR TICKET ]",
            intro_btn: "[ INICIAR SISTEMA ]",
            player_idle: "SIN SEÑAL ACTIVA", vol_label: "VOL", 
            no_results: "NO SE ENCONTRARON DATOS...",
            form_alias: "ALIAS / CODIGO *", form_msg: "MENSAJE / ENLACE *", form_send: "[ ENVIAR DATOS ]",
            form_sent: "/// TRANSMISIÓN ENVIADA ///", form_cd: "/// ENFRIAMIENTO DEL SISTEMA: ESPERE 15 MIN ///",
            form_sending: "ENVIANDO...", form_error: "> ERROR DEL SISTEMA",
            form_ph: "PEGAR ENLACES AQUÍ..."
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
        formStatus: document.getElementById('formStatus'),
        formMsgArea: document.getElementById('message'),
        splashScreen: document.getElementById('splashScreen'),
        enterArchiveBtn: document.getElementById('enterArchiveBtn'),
        mainContent: document.getElementById('mainContent'),
        volWrapper: document.querySelector('.vol-slider-wrap')
    };

    const GITHUB_API_URL = 'https://api.github.com/repos/dxdnidknow/opium-archive-vault/releases';

 function parseFilename(filename, uploadDateString) {
        let raw = filename.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, '').trim();
        let year = 'N/A';
        let extraInfo = '';
        let artist = '';
        let title = '';

        const yearRegex = /\b(19|20)\d{2}\b/;
        const yearMatch = raw.match(yearRegex);
        
        if (yearMatch) {
            year = yearMatch[0];
            raw = raw.replace(yearMatch[0], '').trim();
        } else if (uploadDateString) {
            const d = new Date(uploadDateString);
            if (!isNaN(d.getTime())) {
                year = d.getFullYear();
            }
        }

        const infoRegex = /[\(\[]\s*([^)\]]+)\s*[\)\]]/;
        const infoMatch = raw.match(infoRegex);

        if (infoMatch) {
            extraInfo = infoMatch[1].trim(); 
            raw = raw.replace(infoMatch[0], '').trim();
        }

        // --- INICIO DE CORRECCIÓN: REEMPLAZAR PUNTOS POR ESPACIOS ---
        // Esto limpia nombres como 'Playboi.Carti.-.Steeze'
        raw = raw.replace(/\./g, ' ').trim(); 
        // --- FIN DE CORRECCIÓN ---

        raw = raw.replace(/\s+-\s*$/, '').replace(/^\s*-\s+/, '').trim();

        const splitIndex = raw.indexOf(' - ');
        if (splitIndex !== -1) {
            artist = raw.substring(0, splitIndex).trim();
            title = raw.substring(splitIndex + 3).trim();
        } else {
            title = raw;
            artist = ''; 
        }
        
        title = title.replace(/_/g, ' ').trim();

        return {
            artist: artist,
            title: title,
            year: year,
            extraInfo: extraInfo
        };
    }

    function formatBytes(bytes, decimals = 1) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function updateSystemStatus(statusText) {
        const statusEl = document.querySelector('.status-online');
        if(statusEl) {
            statusEl.innerHTML = `<span class="beacon"></span>${statusText}`;
        }
    }

    async function fetchGitHubReleases() {
        try {
            const response = await fetch(GITHUB_API_URL);
            
            if (!response.ok) {
                if(response.status === 403) throw new Error("API RATE LIMIT EXCEEDED");
                throw new Error("GITHUB CONNECTION FAILED");
            }

            const releases = await response.json();
            let trackIdCounter = 1;
            let newTracks = [];

            releases.forEach(release => {
                release.assets.forEach(asset => {
                    if (asset.name.match(/\.(mp3|wav|m4a|flac|ogg)$/i)) {
                        const meta = parseFilename(asset.name, asset.created_at);
                        newTracks.push({
                            id: trackIdCounter++,
                            title: meta.title,
                            artist: meta.artist,
                            year: meta.year,
                            size: formatBytes(asset.size),
                            src: asset.browser_download_url,
                            uploadDate: asset.created_at, 
                            extraInfo: meta.extraInfo 
                        });
                    }
                });
            });

            state.tracks = newTracks; 
            renderTracks();
            updateSystemStatus("ONLINE // SYNCED");

        } catch (error) {
            console.error("CRITICAL:", error);
            const t = translations[state.lang];
            const errorMsg = error.message.includes("RATE LIMIT") 
                ? "> SYSTEM OVERLOAD: TRY AGAIN LATER (60/hr limit)" 
                : "> CONNECTION LOST: OFFLINE MODE";
            
            if(els.trackList) els.trackList.innerHTML = `<li class="error-msg">${errorMsg}</li>`;
            updateSystemStatus("OFFLINE // ERROR");
        }
    }

    async function init() {
        await fetchGitHubReleases();
        setLanguage(state.lang);
        if(els.volSlider) els.volSlider.value = state.volume;
        if(els.audio) els.audio.volume = state.volume;
        setupModal();
        startSystemClock(); 
        setupHotkeys(); 
    }

    function setupHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            switch(e.code) {
                case 'Space': e.preventDefault(); togglePlay(); break;
                case 'ArrowLeft': e.preventDefault(); changeTrack(-1); break;
                case 'ArrowRight': e.preventDefault(); changeTrack(1); break;
                case 'ArrowUp': e.preventDefault(); adjustVolume(0.05); break;
                case 'ArrowDown': e.preventDefault(); adjustVolume(-0.05); break;
            }
        });
    }

    function renderTracks(filterText = '') {
        if(!els.trackList) return;
        els.trackList.innerHTML = '';
        const t = translations[state.lang];
        
        const filtered = state.tracks.filter(track => {
            const title = (track.title || '').toLowerCase();
            const artist = (track.artist || '').toLowerCase();
            const info = (track.extraInfo || '').toLowerCase();
            const search = filterText.toLowerCase();
            return title.includes(search) || artist.includes(search) || info.includes(search);
        });

        if(filtered.length === 0) {
            els.trackList.innerHTML = `<li style="padding:20px; color:#555; font-style:italic;">${t.no_results}</li>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        filtered.forEach((track) => {
            const realIndex = state.tracks.findIndex(x => x.id === track.id);
            const isActive = realIndex === state.currentTrackIndex;
            
            let displaySubtitle = 'OPIUM ARCHIVE';
            if (track.extraInfo && track.extraInfo.length > 0) {
                displaySubtitle = track.extraInfo;
            } else if (track.artist && track.artist.length > 0) {
                displaySubtitle = track.artist;
            }
            
            const displayYear = track.year || '----';
            const displaySize = track.size || '---';
            
            const li = document.createElement('li');
            li.className = `track-item hover-trigger ${isActive ? 'active-track' : ''}`;
            
            li.innerHTML = `
                <div class="t-id">
                     ${isActive ? '<span class="playing-indicator"></span>' : `<span class="index-num">${track.id < 10 ? '0'+track.id : track.id}</span>`}
                </div>
                <div class="t-info">
                    <span class="t-title">${sanitize(track.title)}</span>
                    <span class="t-artist">${sanitize(displaySubtitle)}</span>
                </div>
                <div class="t-meta hide-mobile">${displayYear}</div>
                <div class="t-meta hide-mobile">${displaySize}</div>
                <div class="col-actions">
                    <button class="icon-btn play-trigger" data-index="${realIndex}">
                        ${isActive && state.isPlaying ? '❚❚' : '▶'}
                    </button>
                    <a href="${track.src}" download class="icon-btn" target="_blank">↓</a>
                </div>
            `;
            fragment.appendChild(li);
        });

        els.trackList.appendChild(fragment);
    }

    function loadTrack(index) {
        state.currentTrackIndex = index;
        const track = state.tracks[index];
        els.audio.src = track.src;
        const mainArtist = track.artist !== 'OPIUM ARCHIVE' ? track.artist : '';
        els.trackTitle.innerText = `${mainArtist ? mainArtist + ' - ' : ''}${track.title}`; 
        
        if (!state.hasPlayedOnce) {
            state.hasPlayedOnce = true;
            els.playerContainer.classList.add('visible');
        }

        renderTracks(els.searchInput.value); 
        
        const playPromise = els.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                updatePlayState(true);
            }).catch(error => {
                updatePlayState(false);
            });
        }
    }

    function togglePlay() {
        if (!els.audio.src && state.tracks.length > 0) { loadTrack(0); return; }
        if (state.isPlaying) {
            els.audio.pause();
            updatePlayState(false);
        } else {
            els.audio.play().then(() => updatePlayState(true)).catch(e => console.error(e));
        }
    }

    function changeTrack(direction) {
        if(state.tracks.length === 0) return;
        let newIndex = state.currentTrackIndex + direction;
        if(newIndex < 0) newIndex = state.tracks.length - 1;
        if(newIndex >= state.tracks.length) newIndex = 0;
        loadTrack(newIndex);
    }

    function adjustVolume(amount) {
        if(!els.audio) return;
        let newVol = Math.min(Math.max(els.audio.volume + amount, 0), 1);
        els.audio.volume = newVol;
        if(els.volSlider) els.volSlider.value = newVol;
        localStorage.setItem(STORAGE_KEY_VOL, newVol);
    }

    function updatePlayState(playing) {
        state.isPlaying = playing;
        els.playBtn.innerText = playing ? 'II' : '▶';
        renderTracks(els.searchInput.value); 
    }

    function setupModal() {
        if(!els.openModalBtn) return;

        els.openModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            els.modal.classList.remove('hidden');
            els.ticketForm.style.display = 'block';
            els.formStatus.innerText = '';
            const anim = document.getElementById('successAnim');
            if(anim) anim.remove();
        });

        els.closeModalBtn.addEventListener('click', () => els.modal.classList.add('hidden'));
        els.modal.addEventListener('click', (e) => { if (e.target === els.modal) els.modal.classList.add('hidden'); });

        els.ticketForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const t = translations[state.lang];

            const honey = e.target.querySelector('input[name="_gotcha"]');
            if (honey && honey.value) return; 

            const lastSent = localStorage.getItem(STORAGE_KEY_COOLDOWN);
            const now = Date.now();
            if (lastSent && (now - parseInt(lastSent)) < COOLDOWN_TIME) {
                els.formStatus.style.color = '#ff0000';
                els.formStatus.innerText = t.form_cd;
                return;
            }

            const form = e.target;
            const data = new FormData(form);
            const submitBtn = form.querySelector('.submit-btn');
            const btnTextSpan = submitBtn.querySelector('.btn-text');
            const originalText = btnTextSpan.innerText;
            
            btnTextSpan.innerHTML = `<span class='blink-anim'>${t.form_sending}</span>`;
            submitBtn.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST', body: data, headers: {'Accept': 'application/json'}
                });
                
                if (response.ok) {
                    localStorage.setItem(STORAGE_KEY_COOLDOWN, now.toString());
                    form.style.display = 'none'; 
                    
                    const successDiv = document.createElement('div');
                    successDiv.id = 'successAnim';
                    successDiv.className = 'success-animation';
                    successDiv.innerHTML = `<div class="glitch-text">${t.form_sent}</div>`;
                    els.modal.querySelector('.modal-body').appendChild(successDiv);
                    
                    form.reset();
                } else {
                    els.formStatus.innerText = t.form_error;
                }
            } catch (error) {
                els.formStatus.innerText = t.form_error;
            } finally {
                btnTextSpan.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    function setLanguage(lang) {
        state.lang = lang;
        localStorage.setItem(STORAGE_KEY_LANG, lang);
        const t = translations[lang];
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(t[key]) el.innerText = t[key];
        });
        
        if(els.searchInput) els.searchInput.placeholder = t.search_placeholder;
        if(els.formMsgArea) els.formMsgArea.placeholder = t.form_ph;
        
        els.langEn.classList.toggle('active', lang === 'en');
        els.langEs.classList.toggle('active', lang === 'es');
        
        renderTracks(els.searchInput.value);
    }

    function startSystemClock() {
        setInterval(() => {
            const now = new Date();
            if(els.sysClock) els.sysClock.innerText = `${now.toISOString().split('T')[0]} // ${now.toUTCString().split(' ')[4]} UTC`;
        }, 1000);
    }

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTime(s) {
        if(isNaN(s)) return "00:00";
        const min = Math.floor(s / 60); const sec = Math.floor(s % 60);
        return `${min}:${sec < 10 ? '0'+sec : sec}`;
    }

    function handleVolumeWheel(e) {
        e.preventDefault();
        const direction = e.deltaY < 0 ? 1 : -1;
        adjustVolume(direction * 0.05);
    }

    if(els.trackList) {
        els.trackList.addEventListener('click', (e) => {
            const btn = e.target.closest('.play-trigger');
            if(btn) {
                const idx = parseInt(btn.dataset.index);
                state.currentTrackIndex === idx ? togglePlay() : loadTrack(idx);
            }
        });
    }

    if(els.playBtn) els.playBtn.addEventListener('click', togglePlay);
    if(els.nextBtn) els.nextBtn.addEventListener('click', () => changeTrack(1));
    if(els.prevBtn) els.prevBtn.addEventListener('click', () => changeTrack(-1));
    if(els.audio) els.audio.addEventListener('ended', () => changeTrack(1));
    
    if(els.volSlider) {
        els.volSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            els.audio.volume = val;
            localStorage.setItem(STORAGE_KEY_VOL, val);
        });
    }

    if(els.searchInput) els.searchInput.addEventListener('input', (e) => renderTracks(e.target.value));

    if(els.audio) {
        els.audio.addEventListener('timeupdate', () => {
            if(isNaN(els.audio.duration)) return;
            const pct = (els.audio.currentTime / els.audio.duration) * 100;
            if(els.progressBar) els.progressBar.style.width = `${pct}%`;
            if(els.timeCurrent) els.timeCurrent.innerText = formatTime(els.audio.currentTime);
            if(els.timeDuration) els.timeDuration.innerText = formatTime(els.audio.duration);
        });
    }

    if(els.progressContainer) {
        els.progressContainer.addEventListener('click', (e) => {
            if(!els.audio.src) return;
            const rect = els.progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            els.audio.currentTime = pos * els.audio.duration;
        });
        els.progressContainer.addEventListener('wheel', handleVolumeWheel, { passive: false });
    }

    if (els.volWrapper) {
        els.volWrapper.addEventListener('wheel', handleVolumeWheel, { passive: false });
    }

    els.navHome.addEventListener('click', (e) => { 
        e.preventDefault(); 
        els.secLeaks.classList.remove('hidden'); els.secAbout.classList.add('hidden');
        els.navHome.classList.add('active'); els.navAbout.classList.remove('active');
    });
    els.navAbout.addEventListener('click', (e) => { 
        e.preventDefault(); 
        els.secLeaks.classList.add('hidden'); els.secAbout.classList.remove('hidden');
        els.navHome.classList.remove('active'); els.navAbout.classList.add('active');
    });
    
    els.langEn.addEventListener('click', () => setLanguage('en'));
    els.langEs.addEventListener('click', () => setLanguage('es'));
    
    if(els.enterArchiveBtn) {
        els.enterArchiveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            els.splashScreen.classList.add('hidden');
            els.mainContent.classList.remove('hidden');
        });
    }

    init();
});