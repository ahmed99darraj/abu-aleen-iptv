document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const groupSelect = document.getElementById('groupSelect');
    const channelsList = document.getElementById('channelsList');
    const searchInput = document.getElementById('searchInput');
    const currentChannelName = document.getElementById('currentChannelName');
    const currentGroup = document.getElementById('currentGroup');
    const errorMessage = document.getElementById('errorMessage');
    
    // Player controls
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const previousButton = document.getElementById('previousButton');
    const nextButton = document.getElementById('nextButton');
    const muteButton = document.getElementById('muteButton');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenButton = document.getElementById('fullscreenButton');

    let allChannels = {};
    let currentChannels = [];
    let currentChannelIndex = -1;
    let hls = null;

    // التحقق من صلاحية الرابط
    async function checkPlaylist() {
        try {
            showError('جاري التحقق من قائمة القنوات...');
            const response = await fetch('/api/check-playlist');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.valid) {
                showError(`خطأ في قائمة القنوات: ${data.message}`);
                return false;
            }
            return true;
        } catch (error) {
            showError(`خطأ في الاتصال بالخادم: ${error.message}`);
            console.error('Error checking playlist:', error);
            return false;
        }
    }

    // عرض رسالة خطأ
    function showError(message) {
        console.log('Error message:', message);
        errorMessage.textContent = message;
        errorMessage.style.display = 'flex';
        if (hls) {
            hls.destroy();
            hls = null;
        }
        videoPlayer.style.display = 'none';
    }

    // إخفاء رسالة الخطأ
    function hideError() {
        errorMessage.style.display = 'none';
        videoPlayer.style.display = 'block';
    }

    // تحميل القنوات
    async function loadChannels() {
        try {
            showError('جاري تحميل القنوات...');
            
            // التحقق من صلاحية الرابط أولاً
            const isValid = await checkPlaylist();
            if (!isValid) return;

            const response = await fetch('/api/channels');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received channels data:', data);
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            if (!data.groups || !data.channels) {
                showError('تنسيق البيانات غير صحيح');
                return;
            }
            
            // تحديث قائمة المجموعات
            groupSelect.innerHTML = '<option value="all">كل المجموعات</option>';
            data.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group;
                option.textContent = group;
                groupSelect.appendChild(option);
            });
            
            allChannels = data.channels;
            hideError();
            displayChannelsByGroup('all');
        } catch (error) {
            showError(`خطأ في تحميل القنوات: ${error.message}`);
            console.error('Error loading channels:', error);
        }
    }

    // عرض القنوات حسب المجموعة
    function displayChannelsByGroup(groupName) {
        try {
            channelsList.innerHTML = '';
            if (groupName === 'all') {
                currentChannels = Object.values(allChannels).flat();
            } else {
                currentChannels = allChannels[groupName] || [];
            }
            
            if (currentChannels.length === 0) {
                channelsList.innerHTML = '<div class="no-channels">لا توجد قنوات في هذه المجموعة</div>';
                return;
            }
            
            displayChannels(currentChannels);
        } catch (error) {
            channelsList.innerHTML = '<div class="error-message">خطأ في عرض القنوات</div>';
            console.error('Error displaying channels:', error);
        }
    }

    // عرض القنوات في القائمة
    function displayChannels(channelsToDisplay) {
        try {
            channelsList.innerHTML = '';
            if (!Array.isArray(channelsToDisplay)) {
                channelsList.innerHTML = '<div class="error-message">خطأ في تنسيق بيانات القنوات</div>';
                return;
            }
            
            channelsToDisplay.forEach((channel, index) => {
                const channelDiv = document.createElement('div');
                channelDiv.className = 'channel-item';
                channelDiv.innerHTML = `
                    ${channel.logo ? `<img src="${channel.logo}" alt="${channel.name}" onerror="this.src='placeholder.png'">` : ''}
                    <span>${channel.name}</span>
                    ${channel.group ? `<small>(${channel.group})</small>` : ''}
                `;
                channelDiv.onclick = () => playChannel(index);
                channelsList.appendChild(channelDiv);
            });
        } catch (error) {
            channelsList.innerHTML = '<div class="error-message">خطأ في عرض القنوات</div>';
            console.error('Error displaying channels:', error);
        }
    }

    // تشغيل القناة
    function playChannel(index) {
        try {
            if (index < 0 || index >= currentChannels.length) {
                showError('رقم القناة غير صحيح');
                return;
            }

            currentChannelIndex = index;
            const channel = currentChannels[index];
            
            if (!channel || !channel.url) {
                showError('رابط القناة غير صالح');
                return;
            }

            // تحديث اسم القناة الحالية
            currentChannelName.textContent = channel.name;
            currentGroup.textContent = channel.group || '';

            // إيقاف التشغيل الحالي
            if (hls) {
                hls.destroy();
                hls = null;
            }

            hideError();
            
            // تحقق من صحة الرابط
            fetch(channel.url, { method: 'HEAD', mode: 'no-cors' })
                .then(() => {
                    // تشغيل القناة
                    if (Hls.isSupported()) {
                        hls = new Hls({
                            xhrSetup: function(xhr) {
                                xhr.withCredentials = false;
                            },
                            debug: false,
                            enableWorker: true,
                            lowLatencyMode: true,
                            backBufferLength: 90
                        });
                        
                        hls.loadSource(channel.url);
                        hls.attachMedia(videoPlayer);
                        
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            videoPlayer.play().catch(error => {
                                console.error('Error playing video:', error);
                                showError('القناة لا تعمل');
                            });
                        });
                        
                        hls.on(Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                                console.error('Fatal error:', data.type, data.details);
                                showError('القناة لا تعمل');
                            }
                        });
                    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                        videoPlayer.src = channel.url;
                        videoPlayer.play().catch(error => {
                            console.error('Error playing video:', error);
                            showError('القناة لا تعمل');
                        });
                    } else {
                        showError('المتصفح لا يدعم تشغيل هذا النوع من القنوات');
                    }
                })
                .catch(error => {
                    console.error('Error checking channel URL:', error);
                    showError('القناة غير متوفرة حالياً - يرجى المحاولة لاحقاً');
                });
        } catch (error) {
            console.error('Error in playChannel:', error);
            showError('القناة لا تعمل');
        }
    }

    // البحث في القنوات
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredChannels = currentChannels.filter(channel => 
            channel.name.toLowerCase().includes(searchTerm) ||
            (channel.group && channel.group.toLowerCase().includes(searchTerm))
        );
        displayChannels(filteredChannels);
    });

    // تحديث المجموعة
    groupSelect.addEventListener('change', (e) => {
        displayChannelsByGroup(e.target.value);
    });

    // أزرار التحكم
    playButton.onclick = () => {
        if (videoPlayer.paused) {
            videoPlayer.play().catch(error => {
                console.error('Error playing video:', error);
                showError('القناة لا تعمل');
            });
        } else {
            videoPlayer.pause();
        }
    };

    stopButton.onclick = () => {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    };

    previousButton.onclick = () => {
        if (currentChannelIndex > 0) {
            playChannel(currentChannelIndex - 1);
        }
    };

    nextButton.onclick = () => {
        if (currentChannelIndex < currentChannels.length - 1) {
            playChannel(currentChannelIndex + 1);
        }
    };

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
    videoPlayer.onplay = () => {
        playButton.textContent = 'إيقاف';
    };

    videoPlayer.onpause = () => {
        playButton.textContent = 'تشغيل';
    };

    // تحميل القنوات
    loadChannels();
});
