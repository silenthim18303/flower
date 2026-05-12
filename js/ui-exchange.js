/**
 * 花农兑换弹窗UI模块
 * 负责玫瑰/雏菊兑换金花的交互逻辑
 */
(function() {
    var cfg = window.FLOWER_CONFIG;
    var modal = window.FlowerUIModal;

    /** 兑换1朵金花所需的玫瑰/雏菊数量 */
    var GOLDEN_EXCHANGE_COST = 500;

    /**
     * 创建花农兑换弹窗DOM元素
     * 包含：标题、兑换说明、玫瑰兑换区、雏菊兑换区、提示文字、关闭按钮
     * @param {Object} ctx - 共享上下文对象
     */
    function createGoldenExchangeModal(ctx) {
        var goldenExchangeModal = document.getElementById('golden-exchange-modal');
        if (!goldenExchangeModal) {
            goldenExchangeModal = document.createElement('div');
            goldenExchangeModal.id = 'golden-exchange-modal';
            goldenExchangeModal.innerHTML = [
                '<div class="golden-exchange-mask" data-close="1"></div>',
                '<div class="golden-exchange-card">',
                '  <div class="golden-exchange-title">花农兑换</div>',
                '  <div class="golden-exchange-desc">可任选一种花兑换：500朵玫瑰 或 500朵雏菊 = 1朵金花（牡丹不支持兑换）</div>',
                '  <div class="golden-exchange-options">',
                '    <div class="golden-exchange-item">',
                '      <div class="golden-exchange-item-title">玫瑰兑换</div>',
                '      <div class="golden-exchange-item-need" id="golden-exchange-rose-need">玫瑰: 0/500</div>',
                '      <button class="golden-exchange-item-action" id="golden-exchange-rose-action" type="button">用500朵玫瑰兑换</button>',
                '    </div>',
                '    <div class="golden-exchange-item">',
                '      <div class="golden-exchange-item-title">雏菊兑换</div>',
                '      <div class="golden-exchange-item-need" id="golden-exchange-daisy-need">雏菊: 0/500</div>',
                '      <button class="golden-exchange-item-action" id="golden-exchange-daisy-action" type="button">用500朵雏菊兑换</button>',
                '    </div>',
                '  </div>',
                '  <div class="golden-exchange-tip" id="golden-exchange-tip"></div>',
                '  <button class="golden-exchange-close" id="golden-exchange-close" type="button">关闭</button>',
                '</div>'
            ].join('');

            // 点击遮罩层关闭弹窗
            goldenExchangeModal.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute('data-close') === '1') {
                    hideGoldenExchangeModal(ctx);
                }
            });

            document.body.appendChild(goldenExchangeModal);
        }

        // 缓存DOM引用
        ctx.refs.goldenExchangeModal = goldenExchangeModal;
        ctx.refs.goldenExchangeRoseNeed = document.getElementById('golden-exchange-rose-need');
        ctx.refs.goldenExchangeDaisyNeed = document.getElementById('golden-exchange-daisy-need');
        ctx.refs.goldenExchangeRoseAction = document.getElementById('golden-exchange-rose-action');
        ctx.refs.goldenExchangeDaisyAction = document.getElementById('golden-exchange-daisy-action');
        ctx.refs.goldenExchangeTip = document.getElementById('golden-exchange-tip');
        ctx.refs.goldenExchangeClose = document.getElementById('golden-exchange-close');

        // 绑定玫瑰兑换按钮事件
        if (ctx.refs.goldenExchangeRoseAction) {
            ctx.refs.goldenExchangeRoseAction.onclick = function() {
                if (ctx.refs.goldenExchangeRoseAction.disabled) {
                    return;
                }
                handleGoldenExchange(ctx, 'rose');
            };
        }

        // 绑定雏菊兑换按钮事件
        if (ctx.refs.goldenExchangeDaisyAction) {
            ctx.refs.goldenExchangeDaisyAction.onclick = function() {
                if (ctx.refs.goldenExchangeDaisyAction.disabled) {
                    return;
                }
                handleGoldenExchange(ctx, 'daisy');
            };
        }

        // 绑定关闭按钮事件
        if (ctx.refs.goldenExchangeClose) {
            ctx.refs.goldenExchangeClose.onclick = function() {
                hideGoldenExchangeModal(ctx);
            };
        }
    }

    /**
     * 检查某种花是否足够兑换金花
     * @param {Object} state - 游戏状态对象
     * @param {string} flowerTypeId - 花种ID（rose 或 daisy）
     * @returns {boolean} 是否足够兑换
     */
    function canExchangeGoldenByType(state, flowerTypeId) {
        if (!state || !state.warehouse) {
            return false;
        }
        var count = state.warehouse[flowerTypeId] || 0;
        return count >= GOLDEN_EXCHANGE_COST;
    }

    /**
     * 设置兑换提示文字
     * @param {Object} ctx - 共享上下文对象
     * @param {string} text - 提示文字
     * @param {boolean} isSuccess - 是否为成功提示
     */
    function setGoldenExchangeTip(ctx, text, isSuccess) {
        if (!ctx.refs.goldenExchangeTip) {
            return;
        }
        ctx.refs.goldenExchangeTip.textContent = text;
        ctx.refs.goldenExchangeTip.className = isSuccess ? 'golden-exchange-tip success' : 'golden-exchange-tip';
    }

    /**
     * 渲染花农兑换状态
     * 更新玫瑰/雏菊数量显示和兑换按钮禁用状态
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderGoldenExchange(ctx, state) {
        if (!ctx.refs.goldenExchangeRoseNeed || !ctx.refs.goldenExchangeDaisyNeed || !ctx.refs.goldenExchangeRoseAction || !ctx.refs.goldenExchangeDaisyAction) {
            return;
        }

        var roseCount = (state.warehouse && state.warehouse.rose) || 0;
        var daisyCount = (state.warehouse && state.warehouse.daisy) || 0;
        var canRoseExchange = canExchangeGoldenByType(state, 'rose');
        var canDaisyExchange = canExchangeGoldenByType(state, 'daisy');

        // 更新数量显示
        ctx.refs.goldenExchangeRoseNeed.textContent = '玫瑰: ' + roseCount + '/' + GOLDEN_EXCHANGE_COST;
        ctx.refs.goldenExchangeDaisyNeed.textContent = '雏菊: ' + daisyCount + '/' + GOLDEN_EXCHANGE_COST;

        // 更新按钮禁用状态
        ctx.refs.goldenExchangeRoseAction.disabled = !canRoseExchange;
        ctx.refs.goldenExchangeDaisyAction.disabled = !canDaisyExchange;
    }

    /**
     * 显示花农兑换弹窗
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function showGoldenExchangeModal(ctx, state) {
        if (!ctx.refs.goldenExchangeModal) {
            return;
        }

        if (state) {
            renderGoldenExchange(ctx, state);
        }
        setGoldenExchangeTip(ctx, '', false);
        modal.open(ctx.refs.goldenExchangeModal);
    }

    /**
     * 隐藏花农兑换弹窗
     * @param {Object} ctx - 共享上下文对象
     */
    function hideGoldenExchangeModal(ctx) {
        if (!ctx.refs.goldenExchangeModal) {
            return;
        }
        modal.close(ctx.refs.goldenExchangeModal);
    }

    /**
     * 处理金花兑换
     * 扣除玫瑰/雏菊，增加金花，刷新界面
     * @param {Object} ctx - 共享上下文对象
     * @param {string} flowerTypeId - 花种ID（rose 或 daisy）
     */
    function handleGoldenExchange(ctx, flowerTypeId) {
        var state = window.FlowerState;
        if (!state || !state.warehouse) {
            return;
        }

        // 仅支持玫瑰和雏菊兑换
        if (flowerTypeId !== 'rose' && flowerTypeId !== 'daisy') {
            return;
        }

        // 检查花朵是否足够
        if (!canExchangeGoldenByType(state, flowerTypeId)) {
            setGoldenExchangeTip(ctx, (flowerTypeId === 'rose' ? '玫瑰' : '雏菊') + '数量不足，无法兑换。', false);
            ctx.render(state);
            return;
        }

        // 扣除花朵，增加金花
        state.warehouse[flowerTypeId] = (state.warehouse[flowerTypeId] || 0) - GOLDEN_EXCHANGE_COST;
        state.warehouse.golden = (state.warehouse.golden || 0) + 1;

        // 刷新界面
        ctx.render(state);
        setGoldenExchangeTip(ctx, '兑换成功：消耗' + (flowerTypeId === 'rose' ? '玫瑰' : '雏菊') + '500，金花 +1', true);

        // 触发交易回调
        if (typeof ctx.callbacks.onTrade === 'function') {
            ctx.callbacks.onTrade('goldenExchange', state.warehouse.golden);
        }
    }

    /** 导出花农兑换接口 */
    window.FlowerUIExchange = {
        create: createGoldenExchangeModal,
        render: renderGoldenExchange,
        show: showGoldenExchangeModal,
        hide: hideGoldenExchangeModal
    };
})();
