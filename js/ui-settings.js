/**
 * 设置弹窗UI模块
 * 负责设置按钮、设置弹窗、背景音乐控制
 */
(function() {
    var modal = window.FlowerUIModal;

    /** 设置弹窗DOM引用 */
    var settingsModal = null;
    
    /** 设置按钮DOM引用 */
    var settingsBtn = null;

    /** 音乐控制按钮 */
    var musicBtn = null;

    /** 背景音乐播放列表 */
    var playlist = [
        'BGM/无价之姐.mp3',
        'BGM/Tanaki.mp3',
        'BGM/自乘风浪.MP3',
        'BGM/Young and Beautiful.MP3'
    ];

    /** 当前播放索引 */
    var currentTrackIndex = 0;

    /** Audio 对象 */
    var audio = null;

    /** 音乐是否正在播放 */
    var isPlaying = false;

    /** 音量 */
    var volume = 0.5;

    /**
     * 初始化音乐播放器
     */
    function initMusic() {
        if (audio) return;

        // 从本地存储恢复
        try {
            var savedVolume = localStorage.getItem('flower_bgm_volume');
            if (savedVolume !== null) {
                var v = parseFloat(savedVolume);
                if (!isNaN(v)) volume = v;
            }
            var savedIndex = localStorage.getItem('flower_bgm_index');
            if (savedIndex !== null) {
                var idx = parseInt(savedIndex, 10);
                if (!isNaN(idx) && idx >= 0 && idx < playlist.length) {
                    currentTrackIndex = idx;
                }
            }
            var savedTime = localStorage.getItem('flower_bgm_time');
            if (savedTime !== null) {
                var t = parseFloat(savedTime);
                if (!isNaN(t)) {
                    // 恢复播放位置（在 play 后设置）
                    audio && (audio.currentTime = t);
                }
            }
        } catch (e) {}

        audio = new Audio();
        audio.volume = volume;
        audio.loop = false;

        audio.addEventListener('ended', function() {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            playCurrentTrack();
        });

        // 定时保存播放位置
        setInterval(function() {
            if (audio && isPlaying) {
                try {
                    localStorage.setItem('flower_bgm_time', audio.currentTime.toString());
                } catch (e) {}
            }
        }, 2000);

        // 自动播放
        playCurrentTrack();
    }

    /**
     * 播放当前曲目
     */
    function playCurrentTrack() {
        if (!audio) return;
        audio.src = playlist[currentTrackIndex];
        
        // 恢复播放位置
        try {
            var savedTime = localStorage.getItem('flower_bgm_time');
            var savedIndex = localStorage.getItem('flower_bgm_index');
            if (savedTime !== null && savedIndex !== null) {
                var t = parseFloat(savedTime);
                var idx = parseInt(savedIndex, 10);
                if (!isNaN(t) && !isNaN(idx) && idx === currentTrackIndex) {
                    audio.currentTime = t;
                }
            }
        } catch (e) {}

        audio.play().catch(function() {
            isPlaying = false;
            updateMusicBtn();
        });
        isPlaying = true;
        saveMusicState();
        updateMusicBtn();
    }

    /**
     * 切换播放/暂停
     */
    function togglePlay() {
        if (!audio) {
            initMusic();
            return;
        }

        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.play().catch(function() {});
            isPlaying = true;
        }
        saveMusicState();
        updateMusicBtn();
    }

    /**
     * 保存音乐状态
     */
    function saveMusicState() {
        try {
            localStorage.setItem('flower_bgm_volume', volume.toString());
            localStorage.setItem('flower_bgm_index', currentTrackIndex.toString());
            if (audio) {
                localStorage.setItem('flower_bgm_time', audio.currentTime.toString());
            }
        } catch (e) {}
    }

    /**
     * 更新音乐按钮显示
     */
    function updateMusicBtn() {
        if (!musicBtn) return;
        musicBtn.textContent = isPlaying ? '♪' : '♪';
        musicBtn.style.opacity = isPlaying ? '1' : '0.5';
    }

    /**
     * 创建设置按钮
     * @param {Object} ctx - 共享上下文对象
     */
    function createSettingsButton(ctx) {
        // 创建音乐按钮（小圆形，放在左下角）
        if (!musicBtn) {
            musicBtn = document.createElement('button');
            musicBtn.id = 'music-toggle-btn';
            musicBtn.type = 'button';
            musicBtn.textContent = '♪';
            musicBtn.onclick = function() {
                if (!audio) {
                    initMusic();
                } else {
                    togglePlay();
                }
            };
            musicBtn.style.cssText = [
                'position: fixed',
                'left: 8px',
                'bottom: 5%',
                'z-index: 25',
                'width: 36px',
                'height: 36px',
                'border: none',
                'border-radius: 50%',
                'background: rgba(255,255,255,0.9)',
                'color: #f5a623',
                'font-size: 18px',
                'cursor: pointer',
                'box-shadow: 0 2px 8px rgba(0,0,0,0.15)',
                'display: flex',
                'align-items: center',
                'justify-content: center',
                'line-height: 1',
                'padding: 0',
                'font-family: inherit'
            ].join(';');
            document.body.appendChild(musicBtn);
        }

        // 创建设置按钮
        var existingBtn = document.getElementById('settings-button');
        if (existingBtn) {
            settingsBtn = existingBtn;
            return;
        }

        settingsBtn = document.createElement('button');
        settingsBtn.id = 'settings-button';
        settingsBtn.className = 'quick-action-btn settings-button';
        settingsBtn.type = 'button';
        settingsBtn.innerHTML = '<span class="settings-icon">⚙️</span>';
        settingsBtn.onclick = function() {
            showSettingsModal(ctx);
        };
        
        settingsBtn.style.position = 'fixed';
        settingsBtn.style.left = '8px';
        settingsBtn.style.bottom = '14%';
        settingsBtn.style.right = 'auto';
        settingsBtn.style.top = 'auto';
        settingsBtn.style.width = '40px';
        settingsBtn.style.padding = '8px 6px';
        
        document.body.appendChild(settingsBtn);
        ctx.refs.settingsBtn = settingsBtn;

        // 延迟初始化音乐（等待用户交互后自动播放）
        setTimeout(function() {
            initMusic();
        }, 500);
    }

    /**
     * 创建设置弹窗
     * @param {Object} ctx - 共享上下文对象
     */
    function createSettingsModal(ctx) {
        if (settingsModal) return;

        settingsModal = document.createElement('div');
        settingsModal.id = 'settings-modal';
        settingsModal.innerHTML = [
            '<div class="settings-modal-mask" data-close="1"></div>',
            '<div class="settings-modal-card">',
            '  <div class="settings-modal-title">设置</div>',
            '  <div class="settings-modal-content">',
            '    <div class="settings-section">',
            '      <div class="settings-section-title" id="music-song-title">未播放</div>',
            '      <div class="music-info">',
            '        <div class="music-status" id="music-status">点击 ♪ 按钮播放</div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '  <button class="settings-modal-close" type="button">关闭</button>',
            '</div>'
        ].join('');

        addSettingsStyles();

        settingsModal.addEventListener('click', function(e) {
            if (e.target.getAttribute('data-close') === '1') {
                hideSettingsModal();
            }
        });

        var closeBtn = settingsModal.querySelector('.settings-modal-close');
        if (closeBtn) {
            closeBtn.onclick = hideSettingsModal;
        }

        document.body.appendChild(settingsModal);
    }

    /**
     * 添加样式
     */
    function addSettingsStyles() {
        if (document.getElementById('settings-styles')) return;

        var style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = `
            .quick-action-btn.settings-button {
                width: 40px;
                padding: 8px 6px;
            }
            
            .settings-button .settings-icon {
                font-size: 20px;
                display: block;
                text-align: center;
            }
            
            #settings-modal {
                position: fixed;
                inset: 0;
                z-index: 43;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.4);
            }
            
            #settings-modal.show {
                display: flex;
            }
            
            .settings-modal-mask {
                position: absolute;
                inset: 0;
                cursor: pointer;
            }
            
            .settings-modal-card {
                position: relative;
                background: #fff;
                border-radius: 20px;
                padding: 24px;
                margin: 15px;
                max-width: 320px;
                width: 85%;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                animation: settingsSlideUp 0.3s ease-out;
            }
            
            @keyframes settingsSlideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .settings-modal-title {
                font-size: 20px;
                font-weight: 700;
                color: #233652;
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 1px solid #eee;
            }
            
            .settings-modal-content {
                min-height: 80px;
            }

            .settings-section {
                margin-bottom: 16px;
            }

            .settings-section-title {
                font-size: 14px;
                font-weight: 700;
                color: #5a7194;
                margin-bottom: 12px;
            }

            .music-info {
                text-align: center;
                padding: 16px;
                background: #f7faff;
                border-radius: 12px;
                border: 1px solid #e4ecf8;
            }

            .music-status {
                font-size: 14px;
                color: #5a7194;
            }
            
            .settings-modal-close {
                display: block;
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 12px;
                background: #e8eef8;
                color: #466288;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                margin-top: 16px;
                font-family: "Microsoft YaHei", sans-serif;
            }
            
            .settings-modal-close:hover {
                background: #dce4f0;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 显示设置弹窗
     * @param {Object} ctx - 共享上下文对象
     */
    function showSettingsModal(ctx) {
        createSettingsModal(ctx);
        settingsModal.classList.add('show');
        
        // 更新歌曲名和状态
        var titleEl = document.getElementById('music-song-title');
        var statusEl = document.getElementById('music-status');
        if (titleEl) {
            titleEl.textContent = isPlaying ? getCurrentTrackName() : '未播放';
        }
        if (statusEl) {
            statusEl.textContent = isPlaying ? '正在播放' : '已暂停';
        }
    }

    /**
     * 隐藏设置弹窗
     */
    function hideSettingsModal() {
        if (!settingsModal) return;
        settingsModal.classList.remove('show');
    }

    /**
     * 渲染
     */
    function render(ctx, state) {
        updateMusicBtn();
    }

    /** 导出接口 */
    window.FlowerUISettings = {
        createButton: createSettingsButton,
        createModal: createSettingsModal,
        show: showSettingsModal,
        hide: hideSettingsModal,
        render: render
    };
})();
