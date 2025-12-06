document.addEventListener('DOMContentLoaded', () => {
const STORAGE_KEY_VOL = 'opium_vault_volume';
const STORAGE_KEY_LANG = 'opium_vault_lang';
const STORAGE_KEY_CACHE = 'opium_vault_data_cache_v3';
const CACHE_DURATION = 3600000;

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
        form_sent: "/// TRANSMISSION SENT ///", form_cd: "/// SYSTEM COOLDOWN: WAIT 15 MIN ///",
        form_sending: "TRANSMITTING...", form_error: "> SYSTEM ERROR",
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
        form_sending: "TRANSMITIENDO...", form_error: "> ERROR DEL SISTEMA",
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
    splashScreen: document.getElementById('splashScreen'),
    enterArchiveBtn: document.getElementById('enterArchiveBtn'),
    mainContent: document.getElementById('mainContent')
};

function parseFilename(filename) {
    let raw = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
    
    raw = raw.replace(/[._]/g, ' ');
    raw = raw.replace(/\s+/g, ' ').trim();

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
    } else {
        const knownArtists = ['CARTI', 'KEN', 'CARSON', 'DESTROY', 'LONELY', 'HOMIXIDE'];
        for(let k of knownArtists) {
            if(raw.toUpperCase().startsWith(k)) {
                let splitIdx = raw.indexOf(' ');
                if(splitIdx > -1) {
                     artist = raw.substring(0, splitIdx);
                     title = raw.substring(splitIdx).trim();
                }
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

async function loadData() {
    const cachedRaw = localStorage.getItem(STORAGE_KEY_CACHE);
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

    try {
        const res = await fetch('https://api.github.com/repos/dxdnidknow/opium-archive-vault/releases');
        
        if (!res.ok) {
            throw new Error(res.status === 403 ? "GITHUB RATE LIMIT EXCEEDED" : `CONNECTION ERROR (${res.status})`);
        }
        
        const releases = await res.json();
        let trackId = 1;
        let tracks = [];

        releases.forEach(release => {
            release.assets.forEach(asset => {
                if (asset.name.match(/\.(mp3|wav|m4a|flac)$/i)) {
                    const meta = parseFilename(asset.name);
                    tracks.push({
                        id: trackId++,
                        title: meta.title,
                        artist: meta.artist,
                        year: meta.year,
                        size: formatBytes(asset.size),
                        src: asset.browser_download_url.replace('http:', 'https:') 
                    });
                }
            });
        });

        state.tracks = tracks;
        localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({
            timestamp: Date.now(),
            data: tracks
        }));
        
        renderTracks();
        updateStatus("ONLINE // SYNCED");

    } catch (e) {
        updateStatus(`OFFLINE // ${e.message}`);
        if(els.trackList) els.trackList.innerHTML = `<li style="padding:20px; color:#ff0000; border:1px solid red;">> ERROR: ${e.message}</li>`;
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
    const filtered = state.tracks.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.artist.toLowerCase().includes(q)
    );

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
        
        li.innerHTML = `
            <div class="t-id">
                ${isActive ? '<span class="playing-indicator"></span>' : `<span class="index-num">${track.id < 10 ? '0'+track.id : track.id}</span>`}
            </div>
            <div class="t-info">
                <span class="t-title">${track.title}</span>
                <span class="t-artist">${track.artist}</span>
            </div>
            <div class="t-meta hide-mobile">${track.year}</div>
            <div class="t-meta hide-mobile">${track.size}</div>
            <div class="col-actions">
                <button class="icon-btn play-trigger" data-index="${realIndex}">
                    ${isActive && state.isPlaying ? '❚❚' : '▶'}
                </button>
                <a href="${track.src}" download class="icon-btn" target="_blank">↓</a>
            </div>
        `;
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

    els.audio.referrerPolicy = "no-referrer";
    els.audio.src = track.src;
    els.audio.load();

    if(!state.hasPlayedOnce) {
        state.hasPlayedOnce = true;
        els.playerContainer.classList.add('visible');
    }

    renderTracks(els.searchInput.value);
    
    try {
        await els.audio.play();
        state.isPlaying = true;
        updatePlayBtn(true);
    } catch (err) {
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
        els.audio.play().then(() => {
            state.isPlaying = true;
            updatePlayBtn(true);
        }).catch(() => {
            state.isPlaying = false;
            updatePlayBtn(false);
        });
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

els.audio.addEventListener('timeupdate', () => {
    if(isNaN(els.audio.duration)) return;
    const pct = (els.audio.currentTime / els.audio.duration) * 100;
    els.progressBar.style.width = `${pct}%`;
    els.timeCurrent.innerText = formatTime(els.audio.currentTime);
    els.timeDuration.innerText = formatTime(els.audio.duration);
});

// FIX AUTO-PLAY: Verifica que haya una pista activa antes de cargar la siguiente
els.audio.addEventListener('ended', () => {
    if(state.currentTrackIndex === -1) return;
    loadTrack(state.currentTrackIndex + 1)
});

els.audio.addEventListener('error', (e) => {
    if(state.tracks.length > 1 && state.currentTrackIndex !== -1) {
        setTimeout(() => {
            loadTrack(state.currentTrackIndex + 1);
        }, 1000); 
    }
});

els.playBtn.addEventListener('click', togglePlay);
els.nextBtn.addEventListener('click', () => loadTrack(state.currentTrackIndex + 1));
els.prevBtn.addEventListener('click', () => loadTrack(state.currentTrackIndex - 1));

if(els.volSlider) {
    els.volSlider.addEventListener('input', (e) => {
        els.audio.volume = parseFloat(e.target.value);
        localStorage.setItem(STORAGE_KEY_VOL, els.audio.volume);
    });
    els.volSlider.value = state.volume;
    els.audio.volume = state.volume;
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

els.progressContainer.addEventListener('click', (e) => {
    if(!els.audio.src || isNaN(els.audio.duration)) return;
    const rect = els.progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    els.audio.currentTime = pos * els.audio.duration;
});

els.searchInput.addEventListener('input', (e) => renderTracks(e.target.value));

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
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
    
    if (els.searchInput) {
        els.searchInput.placeholder = translations[lang].search_placeholder;
        const msgInput = document.getElementById('message');
        if(msgInput) msgInput.placeholder = translations[lang].form_ph;
    }

    els.langEn.classList.remove('active');
    els.langEs.classList.remove('active');
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    renderTracks(els.searchInput.value);
}

els.langEn.addEventListener('click', () => setLang('en'));
els.langEs.addEventListener('click', () => setLang('es'));

els.enterArchiveBtn.addEventListener('click', () => {
    els.splashScreen.style.opacity = '0';
    setTimeout(() => els.splashScreen.classList.add('hidden'), 500);
    els.mainContent.classList.remove('hidden');
    
    // Desbloquear audio context
    els.audio.src = SILENT_AUDIO;
    els.audio.play().then(() => {
         // Audio desbloqueado
    }).catch(() => {});
    
    loadData();
});

// Modal Logic
els.openModalBtn.addEventListener('click', () => { 
    els.modal.classList.remove('hidden');
    setTimeout(() => els.modal.classList.add('open'), 10);
    els.formStatus.innerText = ''; 
});

els.closeModalBtn.addEventListener('click', () => {
    els.modal.classList.remove('open');
    setTimeout(() => els.modal.classList.add('hidden'), 300);
});

// Form Submission Logic (JSON FIX)
els.ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = els.ticketForm.querySelector('.submit-btn .btn-text');
    const originalText = btn.innerText;
    const statusText = els.formStatus;
    
    btn.innerText = translations[state.lang].form_sending;
    statusText.innerText = "";
    
    // Convertir FormData a JSON Objeto
    const formData = new FormData(els.ticketForm);
    const jsonData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(els.ticketForm.action, {
            method: 'POST',
            body: JSON.stringify(jsonData), // Enviar como JSON
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();

        if (response.ok) {
            btn.innerText = "/// DATA SENT ///";
            els.ticketForm.reset();
            setTimeout(() => {
                els.modal.classList.remove('open');
                setTimeout(() => {
                    els.modal.classList.add('hidden');
                    btn.innerText = originalText;
                }, 300);
            }, 1500);
        } else {
            console.error("Formspree Error:", data);
            if (data.errors) {
                statusText.innerText = data.errors.map(err => err.message).join(", ");
            } else {
                statusText.innerText = "ACCESS DENIED (CHECK DOMAIN SETTINGS)";
            }
            btn.innerText = originalText;
        }
    } catch (error) {
        console.error("Network Error:", error);
        statusText.innerText = translations[state.lang].form_error;
        btn.innerText = originalText;
    }
});

setInterval(() => {
    const now = new Date();
    if(els.sysClock) els.sysClock.innerText = `${now.toISOString().split('T')[0]} // ${now.toUTCString().split(' ')[4]} UTC`;
}, 1000);

function formatTime(s) {
    if(isNaN(s) || !isFinite(s)) return "00:00";
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec<10?'0'+sec:sec}`;
}

setLang(state.lang);
});