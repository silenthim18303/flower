(function() {
    var cfg = window.FLOWER_CONFIG;

    var refs = {
        levelPill: null,
        expFill: null,
        expText: null,
        expPercent: null,
        warehouseCard: null,
        warehouseToggle: null,
        warehouseList: null,
        dailyTaskCard: null,
        stageDonateCard: null,
        dailyTaskProgress: null,
        dailyTaskModal: null,
        dailyTaskModalText: null,
        dailyTaskModalClaimBtn: null,
        dailyTaskModalClose: null,
        maxLevelText: null,
        levelUpToast: null,
        seedToolbar: null,
        collectModal: null,
        collectTotal: null,
        collectDetailList: null,
        collectClose: null,
        tradeList: null,
        tradeTip: null,
        goldenExchangeModal: null,
        goldenExchangeRoseNeed: null,
        goldenExchangeDaisyNeed: null,
        goldenExchangeRoseAction: null,
        goldenExchangeDaisyAction: null,
        goldenExchangeTip: null,
        goldenExchangeClose: null,
        quickFertilizeBtn: null,
        quickWaterBtn: null,
        quickPlantBtn: null,
        quickHarvestBtn: null,
        quickFertilizerCount: null,
        quickWateringCount: null,
        quickPlantStatus: null,
        quickHarvestStatus: null
    };

    var onSeedSelect = null;
    var onTrade = null;
    var onDailyTaskClaim = null;
    var onQuickFertilize = null;
    var onQuickWater = null;
    var onQuickPlant = null;
    var onQuickHarvest = null;
    var isWarehouseCollapsed = true;

    var levelUpToastTimer = null;
    var GOLDEN_EXCHANGE_COST = 500;
    var MODAL_CLOSE_ANIM_MS = 220;

    function openAnimatedModal(modal) {
        if (!modal) {
            return;
        }

        if (modal.__closeTimer) {
            clearTimeout(modal.__closeTimer);
            modal.__closeTimer = null;
        }

        modal.classList.remove('closing');
        modal.classList.add('show');
    }

    function closeAnimatedModal(modal) {
        if (!modal) {
            return;
        }

        if (!modal.classList.contains('show') && !modal.classList.contains('closing')) {
            return;
        }

        if (modal.__closeTimer) {
            clearTimeout(modal.__closeTimer);
            modal.__closeTimer = null;
        }

        modal.classList.remove('show');
        modal.classList.add('closing');
        modal.__closeTimer = setTimeout(function() {
            modal.classList.remove('closing');
            modal.__closeTimer = null;
        }, MODAL_CLOSE_ANIM_MS);
    }

    function getSeedFlowerTypes() {
        var list = [];
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            if (cfg.FLOWER_TYPES[i].seedSelectable === false) {
                continue;
            }
            list.push(cfg.FLOWER_TYPES[i]);
        }
        return list;
    }

    function getTradeItemById(id) {
        for (var i = 0; i < cfg.TRADE_ITEMS.length; i++) {
            if (cfg.TRADE_ITEMS[i].id === id) {
                return cfg.TRADE_ITEMS[i];
            }
        }
        return null;
    }

    function ensureUI() {
        var leftTopPanel = document.getElementById('left-top-panel');
        if (!leftTopPanel) {
            leftTopPanel = document.createElement('div');
            leftTopPanel.id = 'left-top-panel';
            document.body.appendChild(leftTopPanel);
        }

        var levelUI = document.getElementById('level-ui');
        if (!levelUI) {
            levelUI = document.createElement('div');
            levelUI.id = 'level-ui';
            levelUI.innerHTML = [
                '<div class="level-header">',
                '  <span class="level-title">Garden Level</span>',
                '  <span class="level-pill" id="level-pill">Lv 1</span>',
                '</div>',
                '<div class="exp-track">',
                '  <div class="exp-fill" id="exp-fill"></div>',
                '</div>',
                '<div class="exp-footer">',
                '  <span class="exp-text" id="exp-text">0/100</span>',
                '  <span class="exp-percent" id="exp-percent">0%</span>',
                '</div>',
                '<div class="max-level-text" id="max-level-text">已满级，已解锁全部花盆</div>',
            ].join('');
        }
        if (levelUI.parentNode !== leftTopPanel) {
            leftTopPanel.appendChild(levelUI);
        }

        var warehouseCard = document.getElementById('warehouse-card');
        if (!warehouseCard) {
            warehouseCard = document.createElement('div');
            warehouseCard.id = 'warehouse-card';
            warehouseCard.className = 'collapsed';
            warehouseCard.innerHTML = [
                '<button class="warehouse-toggle" id="warehouse-toggle" type="button">',
                '  <span class="warehouse-title">仓库</span>',
                '  <span class="warehouse-arrow" id="warehouse-arrow">▾</span>',
                '</button>',
                '<div class="warehouse-list" id="warehouse-list"></div>'
            ].join('');
        }
        if (warehouseCard.parentNode !== leftTopPanel) {
            leftTopPanel.appendChild(warehouseCard);
        }

        var dailyTaskCard = document.getElementById('daily-task-card');
        if (!dailyTaskCard) {
            dailyTaskCard = document.createElement('button');
            dailyTaskCard.id = 'daily-task-card';
            dailyTaskCard.className = 'quick-action-btn daily-task-card';
            dailyTaskCard.type = 'button';
            dailyTaskCard.innerHTML =
                '<span class="daily-task-label">每日任务</span>' +
                '<span class="daily-task-progress" id="daily-task-progress">0/0</span>';
            dailyTaskCard.onclick = function() {
                showDailyTaskModal(window.FlowerState);
            };
            document.body.appendChild(dailyTaskCard);
        }

        var seedToolbar = document.getElementById('seed-toolbar');
        if (!seedToolbar) {
            seedToolbar = document.createElement('div');
            seedToolbar.id = 'seed-toolbar';

            var seedFlowers = getSeedFlowerTypes();

            for (var i = 0; i < seedFlowers.length; i++) {
                var flower = seedFlowers[i];
                var item = document.createElement('div');
                item.className = 'seed-item';
                item.setAttribute('data-flower-id', flower.id);
                item.innerHTML = '<img src="' + flower.logo + '" alt="' + flower.name + '"><div class="seed-name">' + flower.name + '</div>';
                item.addEventListener('click', function() {
                    var flowerId = this.getAttribute('data-flower-id');
                    if (typeof onSeedSelect === 'function') {
                        onSeedSelect(flowerId);
                    }
                });
                seedToolbar.appendChild(item);
            }

            document.body.appendChild(seedToolbar);
        }

        var stageDonateCard = document.getElementById('stage-donate-card');
        if (!stageDonateCard) {
            stageDonateCard = document.createElement('button');
            stageDonateCard.id = 'stage-donate-card';
            stageDonateCard.className = 'seed-item stage-donate-card';
            stageDonateCard.type = 'button';
            stageDonateCard.innerHTML =
                '<img src="img/npc/舞台.png" alt="送给明星">' +
                '<div class="seed-name">送给明星</div>' +
                '<div class="seed-sub">进入舞台</div>';
            stageDonateCard.onclick = function() {
                window.location.href = 'donate.html?v=20260511';
            };
        }

        if (stageDonateCard.parentNode !== seedToolbar) {
            seedToolbar.appendChild(stageDonateCard);
        }

        var quickFertilizeBtn = document.getElementById('quick-fertilize-btn');
        if (!quickFertilizeBtn) {
            var fertilizerItem = getTradeItemById('fertilizer');
            quickFertilizeBtn = document.createElement('button');
            quickFertilizeBtn.id = 'quick-fertilize-btn';
            quickFertilizeBtn.className = 'quick-action-btn quick-action-left';
            quickFertilizeBtn.type = 'button';
            quickFertilizeBtn.innerHTML =
                '<img src="' + (fertilizerItem ? fertilizerItem.image : 'img/工具/肥料.png') + '" alt="一键施肥">' +
                '<span class="quick-action-label">一键施肥</span>' +
                '<span class="quick-action-count" id="quick-fertilizer-count">x0</span>';
            quickFertilizeBtn.onclick = function() {
                if (quickFertilizeBtn.disabled) {
                    return;
                }
                if (typeof onQuickFertilize === 'function') {
                    onQuickFertilize();
                }
            };
            document.body.appendChild(quickFertilizeBtn);
        }

        var quickWaterBtn = document.getElementById('quick-water-btn');
        if (!quickWaterBtn) {
            var waterItem = getTradeItemById('wateringCan');
            quickWaterBtn = document.createElement('button');
            quickWaterBtn.id = 'quick-water-btn';
            quickWaterBtn.className = 'quick-action-btn quick-action-right';
            quickWaterBtn.type = 'button';
            quickWaterBtn.innerHTML =
                '<img src="' + (waterItem ? waterItem.image : 'img/工具/浇水壶.png') + '" alt="一键浇水">' +
                '<span class="quick-action-label">一键浇水</span>' +
                '<span class="quick-action-count" id="quick-watering-count">x0</span>';
            quickWaterBtn.onclick = function() {
                if (quickWaterBtn.disabled) {
                    return;
                }
                if (typeof onQuickWater === 'function') {
                    onQuickWater();
                }
            };
            document.body.appendChild(quickWaterBtn);
        }

        var quickPlantBtn = document.getElementById('quick-plant-btn');
        if (!quickPlantBtn) {
            var plantItem = getTradeItemById('oneClickPlant');
            quickPlantBtn = document.createElement('button');
            quickPlantBtn.id = 'quick-plant-btn';
            quickPlantBtn.className = 'quick-action-btn quick-action-plant';
            quickPlantBtn.type = 'button';
            quickPlantBtn.innerHTML =
                '<img src="' + (plantItem ? plantItem.image : 'img/工具/一键播种.png') + '" alt="一键播种">' +
                '<span class="quick-action-label">一键播种</span>' +
                '<span class="quick-action-count" id="quick-plant-status">未解锁</span>';
            quickPlantBtn.onclick = function() {
                if (quickPlantBtn.disabled) {
                    return;
                }
                if (typeof onQuickPlant === 'function') {
                    onQuickPlant();
                }
            };
            document.body.appendChild(quickPlantBtn);
        }

        var quickHarvestBtn = document.getElementById('quick-harvest-btn');
        if (!quickHarvestBtn) {
            var harvestItem = getTradeItemById('oneClickHarvest');
            quickHarvestBtn = document.createElement('button');
            quickHarvestBtn.id = 'quick-harvest-btn';
            quickHarvestBtn.className = 'quick-action-btn quick-action-harvest';
            quickHarvestBtn.type = 'button';
            quickHarvestBtn.innerHTML =
                '<img src="' + (harvestItem ? harvestItem.image : 'img/工具/一键采摘.png') + '" alt="一键采摘">' +
                '<span class="quick-action-label">一键采摘</span>' +
                '<span class="quick-action-count" id="quick-harvest-status">未解锁</span>';
            quickHarvestBtn.onclick = function() {
                if (quickHarvestBtn.disabled) {
                    return;
                }
                if (typeof onQuickHarvest === 'function') {
                    onQuickHarvest();
                }
            };
            document.body.appendChild(quickHarvestBtn);
        }

        var levelUpToast = document.getElementById('levelup-toast');
        if (!levelUpToast) {
            levelUpToast = document.createElement('div');
            levelUpToast.id = 'levelup-toast';
            document.body.appendChild(levelUpToast);
        }

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

            collectModal.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute('data-close') === '1') {
                    hideCollectModal();
                }
            });

            document.body.appendChild(collectModal);
        }

        var dailyTaskModal = document.getElementById('daily-task-modal');
        if (!dailyTaskModal) {
            dailyTaskModal = document.createElement('div');
            dailyTaskModal.id = 'daily-task-modal';
            dailyTaskModal.innerHTML = [
                '<div class="daily-task-modal-mask" data-close="1"></div>',
                '<div class="daily-task-modal-card">',
                '  <div class="daily-task-modal-title">每日任务</div>',
                '  <div class="daily-task-modal-text" id="daily-task-modal-text">收花 0/0 朵</div>',
                '  <button class="daily-task-modal-claim" id="daily-task-modal-claim" type="button">进行中</button>',
                '  <button class="daily-task-modal-close" id="daily-task-modal-close" type="button">关闭</button>',
                '</div>'
            ].join('');

            dailyTaskModal.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute('data-close') === '1') {
                    hideDailyTaskModal();
                }
            });

            document.body.appendChild(dailyTaskModal);
        }

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

            goldenExchangeModal.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute('data-close') === '1') {
                    hideGoldenExchangeModal();
                }
            });

            document.body.appendChild(goldenExchangeModal);
        }

        refs.levelPill = document.getElementById('level-pill');
        refs.expFill = document.getElementById('exp-fill');
        refs.expText = document.getElementById('exp-text');
        refs.expPercent = document.getElementById('exp-percent');
        refs.warehouseCard = warehouseCard;
        refs.warehouseToggle = document.getElementById('warehouse-toggle');
        refs.warehouseList = document.getElementById('warehouse-list');
        refs.dailyTaskCard = dailyTaskCard;
        refs.stageDonateCard = stageDonateCard;
        refs.dailyTaskProgress = document.getElementById('daily-task-progress');
        refs.dailyTaskModal = dailyTaskModal;
        refs.dailyTaskModalText = document.getElementById('daily-task-modal-text');
        refs.dailyTaskModalClaimBtn = document.getElementById('daily-task-modal-claim');
        refs.dailyTaskModalClose = document.getElementById('daily-task-modal-close');
        refs.maxLevelText = document.getElementById('max-level-text');
        refs.levelUpToast = levelUpToast;
        refs.seedToolbar = seedToolbar;
        refs.collectModal = collectModal;
        refs.collectTotal = document.getElementById('collect-total');
        refs.collectDetailList = document.getElementById('collect-detail-list');
        refs.collectClose = document.getElementById('collect-close');
        refs.tradeList = document.getElementById('trade-list');
        refs.tradeTip = document.getElementById('trade-tip');
        refs.goldenExchangeModal = goldenExchangeModal;
        refs.goldenExchangeRoseNeed = document.getElementById('golden-exchange-rose-need');
        refs.goldenExchangeDaisyNeed = document.getElementById('golden-exchange-daisy-need');
        refs.goldenExchangeRoseAction = document.getElementById('golden-exchange-rose-action');
        refs.goldenExchangeDaisyAction = document.getElementById('golden-exchange-daisy-action');
        refs.goldenExchangeTip = document.getElementById('golden-exchange-tip');
        refs.goldenExchangeClose = document.getElementById('golden-exchange-close');
        refs.quickFertilizeBtn = quickFertilizeBtn;
        refs.quickWaterBtn = quickWaterBtn;
        refs.quickPlantBtn = quickPlantBtn;
        refs.quickHarvestBtn = quickHarvestBtn;
        refs.quickFertilizerCount = document.getElementById('quick-fertilizer-count');
        refs.quickWateringCount = document.getElementById('quick-watering-count');
        refs.quickPlantStatus = document.getElementById('quick-plant-status');
        refs.quickHarvestStatus = document.getElementById('quick-harvest-status');

        if (refs.collectClose) {
            refs.collectClose.onclick = hideCollectModal;
        }

        if (refs.dailyTaskModalClaimBtn) {
            refs.dailyTaskModalClaimBtn.onclick = function() {
                if (refs.dailyTaskModalClaimBtn.disabled) {
                    return;
                }
                if (typeof onDailyTaskClaim === 'function') {
                    onDailyTaskClaim();
                }
            };
        }

        if (refs.dailyTaskModalClose) {
            refs.dailyTaskModalClose.onclick = hideDailyTaskModal;
        }

        if (refs.warehouseToggle) {
            refs.warehouseToggle.onclick = function() {
                isWarehouseCollapsed = !isWarehouseCollapsed;
                renderWarehouseCollapse();
            };
        }

        if (refs.goldenExchangeRoseAction) {
            refs.goldenExchangeRoseAction.onclick = function() {
                if (refs.goldenExchangeRoseAction.disabled) {
                    return;
                }
                handleGoldenExchange('rose');
            };
        }

        if (refs.goldenExchangeDaisyAction) {
            refs.goldenExchangeDaisyAction.onclick = function() {
                if (refs.goldenExchangeDaisyAction.disabled) {
                    return;
                }
                handleGoldenExchange('daisy');
            };
        }

        if (refs.goldenExchangeClose) {
            refs.goldenExchangeClose.onclick = hideGoldenExchangeModal;
        }

        if (refs.tradeList) {
            refs.tradeList.onclick = function(e) {
                var target = e.target;
                if (!target || !target.classList.contains('trade-action')) {
                    return;
                }
                if (target.disabled) {
                    return;
                }
                var toolId = target.getAttribute('data-tool-id');
                if (toolId) {
                    handleTrade(toolId);
                }
            };
        }
    }

    function getCollectedTotal(state) {
        var total = 0;
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flower = cfg.FLOWER_TYPES[i];
            total += state.warehouse[flower.id] || 0;
        }
        return total;
    }

    function renderCollectDetail(state) {
        if (!refs.collectDetailList) {
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

        refs.collectDetailList.innerHTML = rows.join('');
    }

    function renderTradeList(state) {
        if (!refs.tradeList) {
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

        refs.tradeList.innerHTML = html.join('');
    }

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

    function setTradeTip(text, isSuccess) {
        if (!refs.tradeTip) {
            return;
        }
        refs.tradeTip.textContent = text;
        refs.tradeTip.className = isSuccess ? 'trade-tip success' : 'trade-tip';
    }

    function handleTrade(toolId) {
        var state = window.FlowerState;
        if (!state) {
            return;
        }

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

        var total = getCollectedTotal(state);
        if (total < item.cost) {
            setTradeTip('花朵不足，兑换' + item.name + '需要 ' + item.cost + ' 朵。', false);
            return;
        }

        if (item.permanent && state.tools[item.id]) {
            setTradeTip(item.name + ' 已解锁，无法重复兑换。', false);
            return;
        }

        if (!state.tools || typeof state.tools !== 'object') {
            state.tools = {};
        }

        if (!spendFlowers(state, item.cost)) {
            setTradeTip('兑换失败，请重试。', false);
            return;
        }

        if (item.permanent) {
            state.tools[item.id] = true;
        } else {
            var ownedCount = state.tools[item.id] || 0;
            state.tools[item.id] = ownedCount + 1;
        }

        render(state);
        renderTradeList(state);
        setTradeTip(item.permanent ? ('兑换成功：' + item.name + ' 已永久解锁') : ('兑换成功：' + item.name + ' +1'), true);

        if (typeof onTrade === 'function') {
            onTrade(item.id, state.tools[item.id]);
        }
    }

    function renderSeedSelection(selectedFlowerType) {
        if (!refs.seedToolbar) {
            return;
        }

        var items = refs.seedToolbar.querySelectorAll('.seed-item');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var flowerId = item.getAttribute('data-flower-id');
            if (flowerId === selectedFlowerType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }

    function renderWarehouseList(state) {
        if (!refs.warehouseList) {
            return;
        }

        var rows = [];
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flower = cfg.FLOWER_TYPES[i];
            var count = state.warehouse[flower.id] || 0;
            rows.push(
                '<div class="warehouse-item">' +
                '<span class="warehouse-name">' + flower.name + '</span>' +
                '<span class="warehouse-count">' + count + ' 朵</span>' +
                '</div>'
            );
        }

        refs.warehouseList.innerHTML = rows.join('');
    }

    function renderWarehouseCollapse() {
        if (!refs.warehouseCard) {
            return;
        }

        refs.warehouseCard.classList.toggle('collapsed', isWarehouseCollapsed);
        if (refs.warehouseToggle) {
            refs.warehouseToggle.setAttribute('aria-expanded', isWarehouseCollapsed ? 'false' : 'true');
        }
    }

    function renderDailyTask(state) {
        if (!refs.dailyTaskProgress || !refs.dailyTaskModalText || !refs.dailyTaskModalClaimBtn) {
            return;
        }

        var taskCfg = cfg.DAILY_TASK || {};
        var goal = taskCfg.collectGoal || 0;
        var progress = state.dailyTask ? (state.dailyTask.collectProgress || 0) : 0;
        var clampedProgress = Math.min(progress, goal);
        var claimed = !!(state.dailyTask && state.dailyTask.rewardClaimed);
        var reward = taskCfg.reward || {};
        var rewardParts = [];
        if (reward.fertilizer) {
            rewardParts.push('化肥x' + reward.fertilizer);
        }
        if (reward.wateringCan) {
            rewardParts.push('浇水壶x' + reward.wateringCan);
        }
        if (rewardParts.length === 0) {
            rewardParts.push('无');
        }

        refs.dailyTaskProgress.textContent = clampedProgress + '/' + goal;
        refs.dailyTaskModalText.textContent = '收花 ' + clampedProgress + '/' + goal + ' 朵（奖励：' + rewardParts.join('，') + '）';

        if (claimed) {
            refs.dailyTaskModalClaimBtn.textContent = '已领取';
            refs.dailyTaskModalClaimBtn.disabled = true;
            return;
        }

        var canClaim = clampedProgress >= goal && goal > 0;
        refs.dailyTaskModalClaimBtn.textContent = canClaim ? '领取奖励' : '进行中';
        refs.dailyTaskModalClaimBtn.disabled = !canClaim;
    }

    function showDailyTaskModal(state) {
        if (!refs.dailyTaskModal) {
            ensureUI();
        }
        if (!refs.dailyTaskModal) {
            return;
        }

        if (state) {
            renderDailyTask(state);
        }
        openAnimatedModal(refs.dailyTaskModal);
    }

    function hideDailyTaskModal() {
        if (!refs.dailyTaskModal) {
            return;
        }
        closeAnimatedModal(refs.dailyTaskModal);
    }

    function canExchangeGoldenByType(state, flowerTypeId) {
        if (!state || !state.warehouse) {
            return false;
        }
        var count = state.warehouse[flowerTypeId] || 0;
        return count >= GOLDEN_EXCHANGE_COST;
    }

    function setGoldenExchangeTip(text, isSuccess) {
        if (!refs.goldenExchangeTip) {
            return;
        }
        refs.goldenExchangeTip.textContent = text;
        refs.goldenExchangeTip.className = isSuccess ? 'golden-exchange-tip success' : 'golden-exchange-tip';
    }

    function renderGoldenExchange(state) {
        if (!refs.goldenExchangeRoseNeed || !refs.goldenExchangeDaisyNeed || !refs.goldenExchangeRoseAction || !refs.goldenExchangeDaisyAction) {
            return;
        }

        var roseCount = (state.warehouse && state.warehouse.rose) || 0;
        var daisyCount = (state.warehouse && state.warehouse.daisy) || 0;
        var canRoseExchange = canExchangeGoldenByType(state, 'rose');
        var canDaisyExchange = canExchangeGoldenByType(state, 'daisy');
        refs.goldenExchangeRoseNeed.textContent = '玫瑰: ' + roseCount + '/' + GOLDEN_EXCHANGE_COST;
        refs.goldenExchangeDaisyNeed.textContent = '雏菊: ' + daisyCount + '/' + GOLDEN_EXCHANGE_COST;
        refs.goldenExchangeRoseAction.disabled = !canRoseExchange;
        refs.goldenExchangeDaisyAction.disabled = !canDaisyExchange;
    }

    function showGoldenExchangeModal(state) {
        if (!refs.goldenExchangeModal) {
            ensureUI();
        }
        if (!refs.goldenExchangeModal) {
            return;
        }

        if (state) {
            renderGoldenExchange(state);
        }
        setGoldenExchangeTip('', false);
        openAnimatedModal(refs.goldenExchangeModal);
    }

    function hideGoldenExchangeModal() {
        if (!refs.goldenExchangeModal) {
            return;
        }
        closeAnimatedModal(refs.goldenExchangeModal);
    }

    function handleGoldenExchange(flowerTypeId) {
        var state = window.FlowerState;
        if (!state || !state.warehouse) {
            return;
        }

        if (flowerTypeId !== 'rose' && flowerTypeId !== 'daisy') {
            return;
        }

        if (!canExchangeGoldenByType(state, flowerTypeId)) {
            setGoldenExchangeTip((flowerTypeId === 'rose' ? '玫瑰' : '雏菊') + '数量不足，无法兑换。', false);
            render(state);
            return;
        }

        state.warehouse[flowerTypeId] = (state.warehouse[flowerTypeId] || 0) - GOLDEN_EXCHANGE_COST;
        state.warehouse.golden = (state.warehouse.golden || 0) + 1;

        render(state);
        setGoldenExchangeTip('兑换成功：消耗' + (flowerTypeId === 'rose' ? '玫瑰' : '雏菊') + '500，金花 +1', true);

        if (typeof onTrade === 'function') {
            onTrade('goldenExchange', state.warehouse.golden);
        }
    }

    function renderQuickActionButtons(state) {
        if (!refs.quickFertilizeBtn || !refs.quickWaterBtn || !refs.quickPlantBtn || !refs.quickHarvestBtn) {
            return;
        }

        var fertilizerCount = (state.tools && state.tools.fertilizer) || 0;
        var wateringCount = (state.tools && state.tools.wateringCan) || 0;
        var plantUnlocked = !!(state.tools && state.tools.oneClickPlant);
        var harvestUnlocked = !!(state.tools && state.tools.oneClickHarvest);

        refs.quickFertilizerCount.textContent = 'x' + fertilizerCount;
        refs.quickWateringCount.textContent = 'x' + wateringCount;
        refs.quickPlantStatus.textContent = plantUnlocked ? '已解锁' : '未解锁';
        refs.quickHarvestStatus.textContent = harvestUnlocked ? '已解锁' : '未解锁';

        refs.quickFertilizeBtn.disabled = fertilizerCount <= 0;
        refs.quickWaterBtn.disabled = wateringCount <= 0;
        refs.quickPlantBtn.disabled = !plantUnlocked;
        refs.quickHarvestBtn.disabled = !harvestUnlocked;
    }

    function render(state) {
        if (!refs.levelPill) {
            ensureUI();
        }

        var isMaxLevel = state.level >= cfg.MAX_LEVEL;
        var displayExp = isMaxLevel ? state.maxExp : state.exp;
        var expRatio = Math.min(displayExp / state.maxExp, 1);

        refs.levelPill.textContent = 'Lv ' + state.level;
        refs.expFill.style.width = Math.floor(expRatio * 100) + '%';
        refs.expText.textContent = displayExp + '/' + state.maxExp;
        refs.expPercent.textContent = isMaxLevel ? 'MAX' : Math.floor(expRatio * 100) + '%';
        renderWarehouseCollapse();
        renderWarehouseList(state);
        renderDailyTask(state);
        renderGoldenExchange(state);
        refs.maxLevelText.style.display = isMaxLevel ? 'block' : 'none';
        renderSeedSelection(state.selectedFlowerType);
        renderQuickActionButtons(state);

        if (refs.collectModal && refs.collectModal.classList.contains('show')) {
            refs.collectTotal.textContent = getCollectedTotal(state) + ' 朵';
            renderCollectDetail(state);
            renderTradeList(state);
        }
    }

    function showLevelUpToast(level, isMaxLevel) {
        if (!refs.levelUpToast) {
            ensureUI();
        }

        if (levelUpToastTimer) {
            clearTimeout(levelUpToastTimer);
            levelUpToastTimer = null;
        }

        refs.levelUpToast.textContent = isMaxLevel
            ? '恭喜升到 Lv.' + level + '，已解锁全部花盆！'
            : '恭喜升级到 Lv.' + level + '，解锁1个新花盆！';

        refs.levelUpToast.classList.add('show');
        levelUpToastTimer = setTimeout(function() {
            refs.levelUpToast.classList.remove('show');
            levelUpToastTimer = null;
        }, 1800);
    }

    function showCollectModal(state) {
        if (!refs.collectModal) {
            ensureUI();
        }

        if (!refs.collectModal || !refs.collectTotal) {
            return;
        }

        refs.collectTotal.textContent = getCollectedTotal(state) + ' 朵';
        renderCollectDetail(state);
        renderTradeList(state);
        setTradeTip('', false);
        openAnimatedModal(refs.collectModal);
    }

    function hideCollectModal() {
        if (!refs.collectModal) {
            return;
        }
        closeAnimatedModal(refs.collectModal);
    }

    window.FlowerUI = {
        ensureUI: ensureUI,
        render: render,
        showLevelUpToast: showLevelUpToast,
        showCollectModal: showCollectModal,
        hideCollectModal: hideCollectModal,
        setTradeHandler: function(handler) {
            onTrade = handler;
        },
        setDailyTaskClaimHandler: function(handler) {
            onDailyTaskClaim = handler;
        },
        setQuickActionHandlers: function(handlers) {
            onQuickFertilize = handlers && handlers.onFertilize;
            onQuickWater = handlers && handlers.onWater;
            onQuickPlant = handlers && handlers.onPlant;
            onQuickHarvest = handlers && handlers.onHarvest;
        },
        showGoldenExchangeModal: function(state) {
            showGoldenExchangeModal(state || window.FlowerState);
        },
        setSeedSelectHandler: function(handler) {
            onSeedSelect = handler;
        }
    };
})();
