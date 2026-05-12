/**
 * 收花统计弹窗UI模块
 * 负责收花统计展示、道具交易逻辑
 */
(function() {
    var cfg = window.FLOWER_CONFIG;
    var modal = window.FlowerUIModal;

    /**
     * 计算累计收花总数
     * @param {Object} state - 游戏状态对象
     * @returns {number} 所有花种的数量总和
     */
    function getCollectedTotal(state) {
        var total = 0;
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flower = cfg.FLOWER_TYPES[i];
            total += state.warehouse[flower.id] || 0;
        }
        return total;
    }

    /**
     * 创建收花统计弹窗DOM元素
     * 包含：收花总数、花种明细、道具交易列表、交易提示、关闭按钮
     * @param {Object} ctx - 共享上下文对象
     */
    function createCollectModal(ctx) {
        var collectModal = document.getElementById('collect-modal');
        if (!collectModal) {
            collectModal = document.createElement('div');
            collectModal.id = 'collect-modal';
            collectModal.innerHTML = [
                '<div class="collect-modal-mask" data-close="1"></div>',
                '<div class="collect-modal-card">',
                '  <div class="collect-modal-title">收花统计</div>',
                '  <div class="collect-stat-card">',
                '    <div class="collect-stat-label">累计收取花朵</div>',
                '    <div class="collect-stat-value" id="collect-total">0 朵</div>',
                '  </div>',
                '  <div class="collect-detail-list" id="collect-detail-list"></div>',
                '  <div class="trade-title">道具交易</div>',
                '  <div class="trade-list" id="trade-list"></div>',
                '  <div class="trade-tip" id="trade-tip"></div>',
                '  <button class="collect-close-btn" id="collect-close" type="button">关闭</button>',
                '</div>'
            ].join('');

            // 点击遮罩层关闭弹窗
            collectModal.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute('data-close') === '1') {
                    hideCollectModal(ctx);
                }
            });

            document.body.appendChild(collectModal);
        }

        // 缓存DOM引用
        ctx.refs.collectModal = collectModal;
        ctx.refs.collectTotal = document.getElementById('collect-total');
        ctx.refs.collectDetailList = document.getElementById('collect-detail-list');
        ctx.refs.collectClose = document.getElementById('collect-close');
        ctx.refs.tradeList = document.getElementById('trade-list');
        ctx.refs.tradeTip = document.getElementById('trade-tip');

        // 绑定关闭按钮事件
        if (ctx.refs.collectClose) {
            ctx.refs.collectClose.onclick = function() {
                hideCollectModal(ctx);
            };
        }

        // 绑定交易按钮事件（事件委托）
        if (ctx.refs.tradeList) {
            ctx.refs.tradeList.onclick = function(e) {
                var target = e.target;
                if (!target || !target.classList.contains('trade-action')) {
                    return;
                }
                if (target.disabled) {
                    return;
                }
                var toolId = target.getAttribute('data-tool-id');
                if (toolId) {
                    handleTrade(ctx, toolId);
                }
            };
        }
    }

    /**
     * 渲染收花明细列表
     * 显示各花种名称和累计数量
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderCollectDetail(ctx, state) {
        if (!ctx.refs.collectDetailList) {
            return;
        }

        var rows = [];
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flower = cfg.FLOWER_TYPES[i];
            var count = state.warehouse[flower.id] || 0;
            rows.push(
                '<div class="collect-detail-item">' +
                '<span class="collect-detail-name">' + flower.name + '</span>' +
                '<span class="collect-detail-count">' + count + ' 朵</span>' +
                '</div>'
            );
        }

        ctx.refs.collectDetailList.innerHTML = rows.join('');
    }

    /**
     * 渲染交易道具列表
     * 显示道具图标、名称、价格、拥有状态、兑换按钮
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderTradeList(ctx, state) {
        if (!ctx.refs.tradeList) {
            return;
        }

        var total = getCollectedTotal(state);
        var html = [];
        for (var i = 0; i < cfg.TRADE_ITEMS.length; i++) {
            var item = cfg.TRADE_ITEMS[i];
            var owned = (state.tools && state.tools[item.id]) || 0;
            var isPermanent = !!item.permanent;
            var alreadyOwned = isPermanent && !!owned;
            var disabled = alreadyOwned || total < item.cost;
            var descText = isPermanent
                ? item.cost + ' 朵花 / 永久解锁'
                : item.cost + ' 朵花 / 1个';
            var ownedText = isPermanent
                ? '状态：' + (alreadyOwned ? '已解锁' : '未解锁')
                : '已拥有：' + owned;
            var actionText = alreadyOwned ? '已兑换' : '兑换';
            html.push(
                '<div class="trade-item">' +
                '  <img class="trade-icon" src="' + item.image + '" alt="' + item.name + '">' +
                '  <div class="trade-meta">' +
                '    <div class="trade-name">' + item.name + '</div>' +
                '    <div class="trade-desc">' + descText + '</div>' +
                '    <div class="trade-owned">' + ownedText + '</div>' +
                '  </div>' +
                '  <button class="trade-action" data-tool-id="' + item.id + '" type="button"' + (disabled ? ' disabled' : '') + '>' + actionText + '</button>' +
                '</div>'
            );
        }

        ctx.refs.tradeList.innerHTML = html.join('');
    }

    /**
     * 消耗花朵支付兑换费用
     * 按花种顺序依次扣除，直到满足cost
     * @param {Object} state - 游戏状态对象
     * @param {number} cost - 所需花朵总数
     * @returns {boolean} 是否支付成功
     */
    function spendFlowers(state, cost) {
        var remain = cost;
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flowerId = cfg.FLOWER_TYPES[i].id;
            var count = state.warehouse[flowerId] || 0;
            if (count <= 0) {
                continue;
            }
            var used = Math.min(count, remain);
            state.warehouse[flowerId] = count - used;
            remain -= used;
            if (remain <= 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * 设置交易提示文字
     * @param {Object} ctx - 共享上下文对象
     * @param {string} text - 提示文字
     * @param {boolean} isSuccess - 是否为成功提示
     */
    function setTradeTip(ctx, text, isSuccess) {
        if (!ctx.refs.tradeTip) {
            return;
        }
        ctx.refs.tradeTip.textContent = text;
        ctx.refs.tradeTip.className = isSuccess ? 'trade-tip success' : 'trade-tip';
    }

    /**
     * 处理道具交易
     * 校验花朵数量、扣除花朵、发放道具、刷新界面
     * @param {Object} ctx - 共享上下文对象
     * @param {string} toolId - 道具ID
     */
    function handleTrade(ctx, toolId) {
        var state = window.FlowerState;
        if (!state) {
            return;
        }

        // 查找道具配置
        var item = null;
        for (var i = 0; i < cfg.TRADE_ITEMS.length; i++) {
            if (cfg.TRADE_ITEMS[i].id === toolId) {
                item = cfg.TRADE_ITEMS[i];
                break;
            }
        }
        if (!item) {
            return;
        }

        // 校验花朵是否足够
        var total = getCollectedTotal(state);
        if (total < item.cost) {
            setTradeTip(ctx, '花朵不足，兑换' + item.name + '需要 ' + item.cost + ' 朵。', false);
            return;
        }

        // 校验永久道具是否已解锁
        if (item.permanent && state.tools[item.id]) {
            setTradeTip(ctx, item.name + ' 已解锁，无法重复兑换。', false);
            return;
        }

        if (!state.tools || typeof state.tools !== 'object') {
            state.tools = {};
        }

        // 扣除花朵
        if (!spendFlowers(state, item.cost)) {
            setTradeTip(ctx, '兑换失败，请重试。', false);
            return;
        }

        // 发放道具
        if (item.permanent) {
            state.tools[item.id] = true;
        } else {
            var ownedCount = state.tools[item.id] || 0;
            state.tools[item.id] = ownedCount + 1;
        }

        // 刷新界面
        ctx.render(state);
        renderTradeList(ctx, state);
        setTradeTip(ctx, item.permanent ? ('兑换成功：' + item.name + ' 已永久解锁') : ('兑换成功：' + item.name + ' +1'), true);

        // 触发交易回调
        if (typeof ctx.callbacks.onTrade === 'function') {
            ctx.callbacks.onTrade(item.id, state.tools[item.id]);
        }
    }

    /**
     * 显示收花统计弹窗
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function showCollectModal(ctx, state) {
        if (!ctx.refs.collectModal) {
            return;
        }

        if (!ctx.refs.collectTotal) {
            return;
        }

        // 更新弹窗内容
        ctx.refs.collectTotal.textContent = getCollectedTotal(state) + ' 朵';
        renderCollectDetail(ctx, state);
        renderTradeList(ctx, state);
        setTradeTip(ctx, '', false);
        modal.open(ctx.refs.collectModal);
    }

    /**
     * 隐藏收花统计弹窗
     * @param {Object} ctx - 共享上下文对象
     */
    function hideCollectModal(ctx) {
        if (!ctx.refs.collectModal) {
            return;
        }
        modal.close(ctx.refs.collectModal);
    }

    /** 导出收花统计接口 */
    window.FlowerUICollect = {
        create: createCollectModal,
        show: showCollectModal,
        hide: hideCollectModal
    };
})();
