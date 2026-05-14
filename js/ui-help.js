/**
 * 帮助弹窗UI模块
 * 负责帮助弹窗的创建和显示
 * 包含重玩新手教程等功能
 */
(function() {
    var modal = window.FlowerUIModal;

    /** 帮助弹窗DOM引用 */
    var helpModal = null;
    
    /** 物品详情弹窗DOM引用 */
    var itemDetailModal = null;

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
    '    <div class="help-section-title">物品介绍</div>',
    '    <button class="help-item" type="button" id="help-watering">',
    '      <span class="help-item-icon">💧</span>',
    '      <span class="help-item-text">浇水壶</span>',
    '    </button>',
    '    <button class="help-item" type="button" id="help-fertilizer">',
    '      <span class="help-item-icon">🌱</span>',
    '      <span class="help-item-text">化肥</span>',
    '    </button>',
    '    <button class="help-item" type="button" id="help-mutation">',
    '      <span class="help-item-icon">✨</span>',
    '      <span class="help-item-text">金花突变</span>',
    '    </button>',
    '    <button class="help-item" type="button" id="help-oneclick">',
    '      <span class="help-item-icon">⚡</span>',
    '      <span class="help-item-text">一键功能</span>',
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
        
        // 绑定物品介绍按钮事件
        bindItemHelpEvents();
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

    /**
     * 创建物品详情弹窗
     * @param {Object} itemInfo - 物品信息对象
     */
    function createItemDetailModal(itemInfo) {
        if (itemDetailModal) {
            // 更新弹窗内容
            updateItemDetailContent(itemInfo);
            return;
        }

        itemDetailModal = document.createElement('div');
        itemDetailModal.id = 'item-detail-modal';
        itemDetailModal.innerHTML = [
            '<div class="item-detail-mask" data-close="1"></div>',
            '<div class="item-detail-card">',
            '  <div class="item-detail-header">',
            '    <span class="item-detail-icon" id="detail-icon"></span>',
            '    <div class="item-detail-title" id="detail-title"></div>',
            '  </div>',
            '  <div class="item-detail-content" id="detail-content">',
            '  </div>',
            '  <div class="item-detail-footer">',
            '    <button class="item-detail-close" type="button">关闭</button>',
            '  </div>',
            '</div>'
        ].join('');

        // 添加样式
        addItemDetailStyles();

        // 点击遮罩层关闭
        itemDetailModal.addEventListener('click', function(e) {
            var target = e.target;
            if (target && target.getAttribute('data-close') === '1') {
                hideItemDetailModal();
            }
        });

        // 绑定关闭按钮
        var closeBtn = itemDetailModal.querySelector('.item-detail-close');
        if (closeBtn) {
            closeBtn.onclick = hideItemDetailModal;
        }

        document.body.appendChild(itemDetailModal);
        updateItemDetailContent(itemInfo);
    }

    /**
     * 更新物品详情内容
     * @param {Object} itemInfo - 物品信息对象
     */
    function updateItemDetailContent(itemInfo) {
        if (!itemDetailModal || !itemInfo) return;

        document.getElementById('detail-icon').textContent = itemInfo.icon || '';
        document.getElementById('detail-title').textContent = itemInfo.title || '';
        document.getElementById('detail-content').innerHTML = itemInfo.content || '';
    }

    /**
     * 显示物品详情弹窗
     * @param {Object} itemInfo - 物品信息对象
     */
    function showItemDetailModal(itemInfo) {
        createItemDetailModal(itemInfo);
        itemDetailModal.style.display = 'flex';
        setTimeout(function() {
            itemDetailModal.classList.add('show');
        }, 10);
    }

    /**
     * 隐藏物品详情弹窗
     */
    function hideItemDetailModal() {
        if (!itemDetailModal) return;
        
        itemDetailModal.classList.remove('show');
        setTimeout(function() {
            itemDetailModal.style.display = 'none';
        }, 300);
    }

    /**
     * 添加物品详情弹窗样式
     */
    function addItemDetailStyles() {
        if (document.getElementById('item-detail-styles')) return;

        var style = document.createElement('style');
        style.id = 'item-detail-styles';
        style.textContent = `
            #item-detail-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            #item-detail-modal.show {
                opacity: 1;
            }
            
            .item-detail-mask {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
            }
            
            .item-detail-card {
                position: relative;
                background: rgba(255, 255, 255, 0.98);
                border-radius: 20px;
                padding: 25px;
                margin: 20px;
                max-width: 400px;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            
            #item-detail-modal.show .item-detail-card {
                transform: translateY(0);
            }
            
            .item-detail-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .item-detail-icon {
                font-size: 32px;
            }
            
            .item-detail-title {
                font-size: 20px;
                font-weight: bold;
                color: #ff6b9d;
                flex: 1;
            }
            
            .item-detail-content {
                font-size: 16px;
                color: #666;
                line-height: 1.8;
                margin-bottom: 25px;
            }
            
            .item-detail-content p {
                margin: 0 0 12px 0;
            }
            
            .item-detail-content p:last-child {
                margin-bottom: 0;
            }
            
            .item-detail-content .highlight {
                color: #ff6b9d;
                font-weight: bold;
            }
            
            .item-detail-footer {
                text-align: center;
            }
            
            .item-detail-close {
                padding: 10px 30px;
                border: none;
                border-radius: 25px;
                background: linear-gradient(135deg, #ff6b9d, #c44569);
                color: white;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .item-detail-close:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 107, 157, 0.4);
            }
            
            .help-section-title {
                font-size: 14px;
                font-weight: bold;
                color: #999;
                text-transform: uppercase;
                margin: 20px 0 10px 0;
                padding-left: 10px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 绑定物品介绍按钮事件
     */
    function bindItemHelpEvents() {
        // 浇水壶帮助
        var wateringBtn = document.getElementById('help-watering');
        if (wateringBtn) {
            wateringBtn.onclick = function() {
                showItemDetailModal({
                    icon: '💧',
                    title: '浇水壶',
                    content: `
                        <p>使用浇水壶可以让花朵直接生长到下一阶段。</p>
                        <p><span class="highlight">效果：</span>将目标花盆中的花朵推进一个生长阶段</p>
                        <p><span class="highlight">获取方式：</span>每日任务奖励、商店兑换</p>
                        <p><span class="highlight">使用：</span>点击工具栏的浇水壶，然后点击需要加速的花朵</p>
                    `
                });
            };
        }

        // 化肥帮助
        var fertilizerBtn = document.getElementById('help-fertilizer');
        if (fertilizerBtn) {
            fertilizerBtn.onclick = function() {
                showItemDetailModal({
                    icon: '🌱',
                    title: '化肥',
                    content: `
                        <p>使用化肥可以让花朵直接成熟，立即收获！</p>
                        <p><span class="highlight">效果：</span>将目标花盆中的花朵直接催熟到最高阶段</p>
                        <p><span class="highlight">获取方式：</span>每日任务奖励、商店兑换</p>
                        <p><span class="highlight">使用：</span>点击工具栏的化肥，然后点击需要催熟的花朵</p>
                    `
                });
            };
        }

        // 金花突变帮助
        var mutationBtn = document.getElementById('help-mutation');
        if (mutationBtn) {
            mutationBtn.onclick = function() {
                showItemDetailModal({
                    icon: '✨',
                    title: '金花突变',
                    content: `
                        <p>当种植牡丹时，有一定概率突变为珍贵的金花！</p>
                        <p><span class="highlight">突变概率：</span>每次生长阶段有1%的概率</p>
                        <p><span class="highlight">金花价值：</span>金花是最高价值的花朵，兑换道具时效率更高</p>
                        <p><span class="highlight">提示：</span>使用化肥可以增加突变机会，因为每次阶段变化都有概率</p>
                    `
                });
            };
        }

        // 一键功能帮助
        var oneclickBtn = document.getElementById('help-oneclick');
        if (oneclickBtn) {
            oneclickBtn.onclick = function() {
                showItemDetailModal({
                    icon: '⚡',
                    title: '一键功能',
                    content: `
                        <p>永久解锁的便捷功能，让种花更轻松！</p>
                        <p><span class="highlight">一键播种：</span>自动为所有空花盆播种当前选中的花种</p>
                        <p><span class="highlight">一键采摘：</span>自动收获所有成熟的花朵</p>
                        <p><span class="highlight">获取方式：</span>使用花朵在商店永久兑换</p>
                        <p><span class="highlight">提示：</span>这些功能可以大大节省你的操作时间！</p>
                    `
                });
            };
        }
    }

    /** 导出帮助弹窗接口 */
    window.FlowerUIHelp = {
        create: createHelpModal,
        show: showHelpModal,
        hide: hideHelpModal
    };
})();
