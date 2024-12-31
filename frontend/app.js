let channels = [];
let currentChannelIndex = -1;
const videoPlayer = document.getElementById('videoPlayer');
const channelsList = document.getElementById('channelsList');
const searchInput = document.getElementById('searchInput');
const playlistSelect = document.getElementById('playlistSelect');
const playButton = document.getElementById('playButton');
const stopButton = document.getElementById('stopButton');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const muteButton = document.getElementById('muteButton');
const volumeSlider = document.getElementById('volumeSlider');
const fullscreenButton = document.getElementById('fullscreenButton');

// API Base URL
const API_BASE_URL = 'https://abu-aleen-iptv-backend.onrender.com';

// Fetch channels from backend
async function fetchChannels(playlist = 'all') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/channels/${playlist}`);
        channels = await response.json();
        displayChannels(channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'عذراً، حدث خطأ في تحميل القنوات. يرجى المحاولة مرة أخرى.';
        channelsList.innerHTML = '';
        channelsList.appendChild(errorDiv);
    }
}

// Display channels in sidebar
function displayChannels(channelsToDisplay) {
    channelsList.innerHTML = '';
    channelsToDisplay.forEach((channel, index) => {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel-item';
        
        // Add channel logo if available
        if (channel.logo) {
            const logo = document.createElement('img');
            logo.src = channel.logo;
            logo.className = 'channel-logo';
            channelDiv.appendChild(logo);
        }
        
        const name = document.createElement('span');
        name.textContent = channel.name;
        channelDiv.appendChild(name);
        
        // Add category badges
        if (channel.categories && channel.categories.length > 0) {
            const badges = document.createElement('div');
            badges.className = 'category-badges';
            channel.categories.forEach(category => {
                const badge = document.createElement('span');
                badge.className = 'category-badge';
                badge.textContent = category;
                badges.appendChild(badge);
            });
            channelDiv.appendChild(badges);
        }
        
        channelDiv.onclick = () => playChannel(index);
        channelsList.appendChild(channelDiv);
    });
}

// Play selected channel
function playChannel(index) {
    if (index < 0 || index >= channels.length) return;
    
    currentChannelIndex = index;
    const channel = channels[index];
    
    // Update active channel in list
    document.querySelectorAll('.channel-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    // Play video
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoPlayer.play();
        });
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = channel.url;
        videoPlayer.play();
    }
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredChannels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchTerm) ||
        channel.categories.some(cat => cat.toLowerCase().includes(searchTerm))
    );
    displayChannels(filteredChannels);
});

// Playlist selection
playlistSelect.addEventListener('change', (e) => {
    fetchChannels(e.target.value);
});

// Control buttons functionality
playButton.onclick = () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playButton.textContent = '⏸';
    } else {
        videoPlayer.pause();
        playButton.textContent = '⏵';
    }
};

stopButton.onclick = () => {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    playButton.textContent = '⏵';
};

prevButton.onclick = () => {
    playChannel(currentChannelIndex - 1);
};

nextButton.onclick = () => {
    playChannel(currentChannelIndex + 1);
};

muteButton.onclick = () => {
    videoPlayer.muted = !videoPlayer.muted;
    muteButton.textContent = videoPlayer.muted ? '🔇' : '🔊';
};

volumeSlider.onchange = (e) => {
    videoPlayer.volume = e.target.value / 100;
};

fullscreenButton.onclick = () => {
    if (videoPlayer.requestFullscreen) {
        videoPlayer.requestFullscreen();
    } else if (videoPlayer.webkitRequestFullscreen) {
        videoPlayer.webkitRequestFullscreen();
    } else if (videoPlayer.msRequestFullscreen) {
        videoPlayer.msRequestFullscreen();
    }
};

// Initialize
fetchChannels();
