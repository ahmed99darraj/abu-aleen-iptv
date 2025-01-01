document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const playlistSelect = document.getElementById('playlistSelect');
    const channelsList = document.getElementById('channelsList');
    const searchInput = document.getElementById('searchInput');
    const currentChannelName = document.getElementById('currentChannelName');
    
    // Player controls
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const previousButton = document.getElementById('previousButton');
    const nextButton = document.getElementById('nextButton');
    const muteButton = document.getElementById('muteButton');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenButton = document.getElementById('fullscreenButton');

    let channels = [];
    let currentChannelIndex = -1;
    let hls = null;

    // تحميل القنوات
    async function loadChannels(playlist) {
        try {
            const response = await fetch(`/api/channels/${playlist}`);
            const data = await response.json();
            channels = data;
            displayChannels(channels);
        } catch (error) {
            console.error('Error loading channels:', error);
        }
    }

    // عرض القنوات في القائمة
    function displayChannels(channelsToDisplay) {
        channelsList.innerHTML = '';
        channelsToDisplay.forEach((channel, index) => {
            const channelDiv = document.createElement('div');
            channelDiv.className = 'channel-item';
            channelDiv.innerHTML = `
                ${channel.logo ? `<img src="${channel.logo}" alt="${channel.name}" onerror="this.src='placeholder.png'">` : ''}
                <span>${channel.name}</span>
            `;
            channelDiv.onclick = () => playChannel(index);
            channelsList.appendChild(channelDiv);
        });
    }

    // تشغيل القناة
    function playChannel(index) {
        if (index < 0 || index >= channels.length) return;
        
        currentChannelIndex = index;
        const channel = channels[index];
        currentChannelName.textContent = channel.name;

        if (hls) {
            hls.destroy();
        }

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(channel.url);
            hls.attachMedia(videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play().catch(error => {
                    console.error('Error playing video:', error);
                });
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = channel.url;
            videoPlayer.play().catch(error => {
                console.error('Error playing video:', error);
            });
        }
    }

    // البحث في القنوات
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredChannels = channels.filter(channel => 
            channel.name.toLowerCase().includes(searchTerm)
        );
        displayChannels(filteredChannels);
    });

    // أزرار التحكم
    playButton.onclick = () => videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause();
    stopButton.onclick = () => {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    };
    previousButton.onclick = () => playChannel(currentChannelIndex - 1);
    nextButton.onclick = () => playChannel(currentChannelIndex + 1);
    muteButton.onclick = () => {
        videoPlayer.muted = !videoPlayer.muted;
        muteButton.textContent = videoPlayer.muted ? 'إلغاء كتم الصوت' : 'كتم الصوت';
    };
    volumeSlider.oninput = (e) => {
        videoPlayer.volume = e.target.value / 100;
    };
    fullscreenButton.onclick = () => {
        if (videoPlayer.requestFullscreen) {
            videoPlayer.requestFullscreen();
        } else if (videoPlayer.webkitRequestFullscreen) {
            videoPlayer.webkitRequestFullscreen();
        }
    };

    // تحديث حالة زر التشغيل
    videoPlayer.onplay = () => playButton.textContent = 'إيقاف مؤقت';
    videoPlayer.onpause = () => playButton.textContent = 'تشغيل';

    // تحميل القنوات عند تغيير القائمة
    playlistSelect.addEventListener('change', () => {
        loadChannels(playlistSelect.value);
    });

    // تحميل القنوات الافتراضية
    loadChannels('all');
});
