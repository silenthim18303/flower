/**
 * 帮助弹窗UI模块
 * 负责帮助弹窗的创建和显示
 * 包含重玩新手教程等功能
 */
(function() {
    var modal = window.FlowerUIModal;

    /** 帮助弹窗DOM引用 */
    var helpModal = null;

    /**
     * 创建帮助弹窗DOM元素
     * 包含：帮助标题、功能列表、关闭按钮
     */
    function createHelpModal() {
        if (helpModal) {
            return;
        }

        helpModal = document.createElement('div');
        helpModal.id = 'help-modal';
        helpModal.innerHTML = [
            '<div class="help-modal-mask" data-close="1"></div>',
            '<div class="help-modal-card">',
            '  <div class="help-modal-title">帮助</div>',
            '  <div class="help-modal-list">',
            '    <button class="help-item" type="button" id="help-replay-guide">',
            '      <span class="help-item-icon">📖</span>',
            '      <span class="help-item-text">重玩新手教程</span>',
            '    </button>',
            '  </div>',
            '  <button class="help-modal-close" type="button">关闭</button>',
            '</div>'
        ].join('');

        // 点击遮罩层关闭
        helpModal.addEventListener('click', function(e) {
            var target = e.target;
            if (target && target.getAttribute('data-close') === '1') {
                hideHelpModal();
            }
        });

        document.body.appendChild(helpModal);

        // 绑定关闭按钮
        var closeBtn = helpModal.querySelector('.help-modal-close');
        if (closeBtn) {
            closeBtn.onclick = hideHelpModal;
        }

        // 绑定重玩新手教程
        var replayGuideBtn = document.getElementById('help-replay-guide');
        if (replayGuideBtn) {
            replayGuideBtn.onclick = function() {
                // 清除新手教程完成标记
                try {
                    localStorage.removeItem('flower_guide_completed');
                } catch (e) {
                }
                // 跳转到新手教程页面
                window.location.href = 'guide.html';
            };
        }
    }

    /**
     * 显示帮助弹窗
     */
    function showHelpModal() {
        if (!helpModal) {
            createHelpModal();
        }
        modal.open(helpModal);
    }

    /**
     * 隐藏帮助弹窗
     */
    function hideHelpModal() {
        if (!helpModal) {
            return;
        }
        modal.close(helpModal);
    }

    /** 导出帮助弹窗接口 */
    window.FlowerUIHelp = {
        create: createHelpModal,
        show: showHelpModal,
        hide: hideHelpModal
    };
})();
