/**
 * 设置弹窗UI模块
 * 负责设置按钮和设置弹窗的创建和显示
 */
(function() {
    var modal = window.FlowerUIModal;

    /** 设置弹窗DOM引用 */
    var settingsModal = null;
    
    /** 设置按钮DOM引用 */
    var settingsBtn = null;

    /**
     * 创建设置按钮（固定在界面左侧，每日任务按钮下方）
     * @param {Object} ctx - 共享上下文对象
     */
    function createSettingsButton(ctx) {
        var existingBtn = document.getElementById('settings-button');
        if (existingBtn) {
            settingsBtn = existingBtn;
            return;
        }

        settingsBtn = document.createElement('button');
        settingsBtn.id = 'settings-button';
        settingsBtn.className = 'quick-action-btn settings-button';
        settingsBtn.type = 'button';
        settingsBtn.innerHTML = 
            '<span class="settings-icon">⚙️</span>';
        settingsBtn.onclick = function() {
            showSettingsModal(ctx);
        };
        
        // 先设置内联样式，避免位置跳动
        settingsBtn.style.position = 'fixed';
        settingsBtn.style.left = '8px';
        settingsBtn.style.bottom = '10%';
        settingsBtn.style.right = 'auto';
        settingsBtn.style.top = 'auto';
        settingsBtn.style.width = '40px';
        settingsBtn.style.padding = '8px 6px';
        
        document.body.appendChild(settingsBtn);

        // 缓存DOM引用
        ctx.refs.settingsBtn = settingsBtn;
    }

    /**
     * 创建设置弹窗DOM元素
     * @param {Object} ctx - 共享上下文对象
     */
    function createSettingsModal(ctx) {
        if (settingsModal) {
            return;
        }

        settingsModal = document.createElement('div');
        settingsModal.id = 'settings-modal';
        settingsModal.innerHTML = [
            '<div class="settings-modal-mask" data-close="1"></div>',
            '<div class="settings-modal-card">',
            '  <div class="settings-modal-title">设置</div>',
            '  <div class="settings-modal-content">',
            '    <div class="settings-empty-state">',
            '      <div class="settings-empty-icon">🛠️</div>',
            '      <div class="settings-empty-text">设置功能开发中...</div>',
            '      <div class="settings-empty-subtitle">敬请期待更多设置选项</div>',
            '    </div>',
            '  </div>',
            '  <button class="settings-modal-close" type="button">关闭</button>',
            '</div>'
        ].join('');

        // 添加样式
        addSettingsStyles();

        // 点击遮罩层关闭
        settingsModal.addEventListener('click', function(e) {
            var target = e.target;
            if (target && target.getAttribute('data-close') === '1') {
                hideSettingsModal();
            }
        });

        // 绑定关闭按钮
        var closeBtn = settingsModal.querySelector('.settings-modal-close');
        if (closeBtn) {
            closeBtn.onclick = hideSettingsModal;
        }

        document.body.appendChild(settingsModal);
    }

    /**
     * 添加设置弹窗样式
     */
    function addSettingsStyles() {
        if (document.getElementById('settings-styles')) return;

        var style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = `
            /* 设置按钮样式 */
            .quick-action-btn.settings-button {
                right: 8px;
                top: 330px; /* 移动端一键采摘按钮在284px，下面46px的位置 */
                bottom: auto;
                left: auto;
                width: 40px; /* 从默认69px改为40px，减少约42%宽度 */
                padding: 8px 6px;
            }
            
            .settings-button .settings-icon {
                font-size: 20px;
                display: block;
                text-align: center;
            }
            
            /* 设置弹窗样式 */
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
                background: rgba(255, 255, 255, 0.98);
                border-radius: 20px;
                padding: 30px;
                margin: 20px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .settings-modal-title {
                font-size: 24px;
                font-weight: bold;
                color: #ff6b9d;
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .settings-modal-content {
                min-height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .settings-empty-state {
                text-align: center;
            }
            
            .settings-empty-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.6;
            }
            
            .settings-empty-text {
                font-size: 18px;
                color: #333;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .settings-empty-subtitle {
                font-size: 14px;
                color: #999;
            }
            
            .settings-modal-close {
                display: block;
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 25px;
                background: linear-gradient(135deg, #ff6b9d, #c44569);
                color: white;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 20px;
            }
            
            .settings-modal-close:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 107, 157, 0.4);
            }
            
            .settings-modal-card {
                margin: 15px;
                padding: 20px;
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
    }

    /**
     * 隐藏设置弹窗
     */
    function hideSettingsModal() {
        if (!settingsModal) return;
        
        settingsModal.classList.remove('show');
    }

    /**
     * 渲染设置界面
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function render(ctx, state) {
        // 暂时不需要渲染逻辑，空界面
    }

    /** 导出设置接口 */
    window.FlowerUISettings = {
        createButton: createSettingsButton,
        createModal: createSettingsModal,
        show: showSettingsModal,
        hide: hideSettingsModal,
        render: render
    };
})();