

import { auth, realtimeDb, isAdmin } from './firebase-config.js';
import { ref, onValue, set, update, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';


const contentDisplay = document.getElementById('content-display');
const controlPanel = document.getElementById('control-panel');
const playAllBtn = document.getElementById('play-all');
const rewindAllBtn = document.getElementById('rewind-all');
const forwardAllBtn = document.getElementById('forward-all');
const volumeAllSelect = document.getElementById('volume-all');
const playPersonalBtn = document.getElementById('play-personal');
const rewindPersonalBtn = document.getElementById('rewind-personal');
const forwardPersonalBtn = document.getElementById('forward-personal');
const mutePersonalBtn = document.getElementById('mute-personal');
const unmutePersonalBtn = document.getElementById('unmute-personal');
const fullscreenPersonalBtn = document.getElementById('fullscreen-personal');
const switchDisplayBtn = document.getElementById('switch-display');
const youtubeUrlInput = document.getElementById('youtube-url');
const playYoutubeBtn = document.getElementById('play-youtube');
const startShareBtn = document.getElementById('start-share');
const stopShareBtn = document.getElementById('stop-share');
const filmBtn = document.getElementById('film-btn');
const addFilmBtn = document.getElementById('add-film');
const suggestionArea = document.getElementById('suggestion-area');
const submitSuggestionBtn = document.getElementById('submit-suggestion');


let videoElement = null;
let youtubePlayer = null;
let currentRoomId = null;
let isRoomOwner = false; 


export function initVideoControls(roomId) {
    currentRoomId = roomId;

    
    const stateRef = ref(realtimeDb, `roomStates/${roomId}/videoState`);
    onValue(stateRef, (snapshot) => {
        const state = snapshot.val();
        if (!state) return;

        if (state.type === 'youtube') {
            loadYouTubeVideo(state.url, state.currentTime, state.playing);
        } else if (state.type === 'film') {
            loadFilmVideo(state.url, state.currentTime, state.playing);
        } else if (state.type === 'screen-share') {
            
            contentDisplay.innerHTML = '<div class="text-center text-white p-5">مشاركة شاشة جارية...</div>';
        }

        if (videoElement) {
            videoElement.currentTime = state.currentTime || 0;
            videoElement.volume = (state.volume || 50) / 100;
            if (state.playing) {
                videoElement.play().catch(() => {});
            } else {
                videoElement.pause();
            }
        }
    });

    
    document.getElementById('control-panel-btn').addEventListener('click', () => {
        controlPanel.classList.toggle('hidden');
    });
}


function loadYouTubeVideo(url, time = 0, playing = false) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (!videoId) return;

    contentDisplay.innerHTML = `<iframe id="youtube-player" width="100%" height="100%" 
        src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=0&rel=0&start=${Math.floor(time)}"
        frameborder="0" allowfullscreen></iframe>`;

    
    youtubePlayer = document.getElementById('youtube-player');
}


function loadFilmVideo(url, time = 0, playing = false) {
    contentDisplay.innerHTML = `
        <video id="film-player" width="100%" height="100%" controls="false">
            <source src="${url}" type="video/mp4">
        </video>
        <button class="play-center-btn">تشغيل</button>
    `;

    videoElement = document.getElementById('film-player');
    videoElement.currentTime = time;
    videoElement.volume = 0.5;

    
    const playBtn = contentDisplay.querySelector('.play-center-btn');
    playBtn.addEventListener('click', () => {
        videoElement.play();
        playBtn.remove();
        if (isRoomOwner || isAdmin) {
            update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
                playing: true
            });
        }
    });
}


playYoutubeBtn.addEventListener('click', () => {
    const url = youtubeUrlInput.value.trim();
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        document.getElementById('youtube-error').textContent = 'رابط يوتيوب غير صحيح';
        return;
    }

    if (isRoomOwner || isAdmin) {
        update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
            type: 'youtube',
            url: url,
            currentTime: 0,
            playing: true,
            volume: 50
        });
    } else {
        alert('فقط صاحب الغرفة أو الأدمن يمكنه تغيير المحتوى');
    }
});


startShareBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = true; // لتجنب echo
        contentDisplay.innerHTML = '';
        contentDisplay.appendChild(videoElement);

        startShareBtn.classList.add('hidden');
        stopShareBtn.classList.remove('hidden');

        if (isRoomOwner || isAdmin) {
            update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
                type: 'screen-share',
                playing: true
            });
        }
    } catch (error) {
        document.getElementById('share-error').textContent = 'خطأ في مشاركة الشاشة: ' + error.message;
    }
});

stopShareBtn.addEventListener('click', () => {
    if (videoElement?.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
    contentDisplay.innerHTML = '<div class="text-center text-white p-5">مشاركة الشاشة توقفت</div>';
    startShareBtn.classList.remove('hidden');
    stopShareBtn.classList.add('hidden');
});


filmBtn.addEventListener('click', () => {
    if (!isRoomOwner && !isAdmin) {
        alert('فقط صاحب الغرفة أو الأدمن يمكنه اختيار الفيلم');
        return;
    }

    const filmUrl = 'https://ia801409.us.archive.org/30/items/20251228_20251228_1429/GTA_%20San%20Andreas%202025-12-19%2018-40-33.mp4';

    update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
        type: 'film',
        url: filmUrl,
        currentTime: 0,
        playing: false,
        volume: 50
    });
});


addFilmBtn.addEventListener('click', () => {
    suggestionArea.classList.toggle('hidden');
});

submitSuggestionBtn.addEventListener('click', async () => {
    const text = document.getElementById('suggestion-text').value.trim();
    if (!text) return;

    try {
        
        alert('تم إرسال الاقتراح! سيتم مراجعته قريباً');
        document.getElementById('suggestion-text').value = '';
        suggestionArea.classList.add('hidden');
    } catch (error) {
        alert('خطأ في إرسال الاقتراح');
    }
});


playAllBtn.addEventListener('click', () => {
    if (!isRoomOwner && !isAdmin) return alert('فقط صاحب الغرفة أو الأدمن يتحكم');
    if (videoElement) {
        videoElement.paused ? videoElement.play() : videoElement.pause();
        update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
            playing: !videoElement.paused
        });
    }
});

rewindAllBtn.addEventListener('click', () => {
    if (!isRoomOwner && !isAdmin) return;
    if (videoElement) {
        videoElement.currentTime -= 10;
        update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
            currentTime: videoElement.currentTime
        });
    }
});

forwardAllBtn.addEventListener('click', () => {
    if (!isRoomOwner && !isAdmin) return;
    if (videoElement) {
        videoElement.currentTime += 10;
        update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), {
            currentTime: videoElement.currentTime
        });
    }
});

volumeAllSelect.addEventListener('change', () => {
    if (!isRoomOwner && !isAdmin) return;
    const vol = parseInt(volumeAllSelect.value) / 100;
    if (videoElement) videoElement.volume = vol;
    update(ref(realtimeDb, `roomStates/${currentRoomId}/videoState`), { volume: parseInt(volumeAllSelect.value) });
});


playPersonalBtn.addEventListener('click', () => videoElement?.paused ? videoElement.play() : videoElement.pause());
rewindPersonalBtn.addEventListener('click', () => { if (videoElement) videoElement.currentTime -= 10; });
forwardPersonalBtn.addEventListener('click', () => { if (videoElement) videoElement.currentTime += 10; });
mutePersonalBtn.addEventListener('click', () => { if (videoElement) videoElement.muted = true; });
unmutePersonalBtn.addEventListener('click', () => { if (videoElement) videoElement.muted = false; });
fullscreenPersonalBtn.addEventListener('click', () => contentDisplay.requestFullscreen().catch(() => {}));


switchDisplayBtn.addEventListener('click', () => {
    contentDisplay.innerHTML = '';
    if (currentCategory === 'youtube') {
        document.getElementById('youtube-screen').classList.remove('hidden');
    } else if (currentCategory === 'film') {
        document.getElementById('film-screen').classList.remove('hidden');
    }
});