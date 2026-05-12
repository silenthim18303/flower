/**
 * 种子工具栏与快捷按钮UI模块
 * 负责花种选择工具栏、送给明星入口、一键操作按钮
 */
(function() {
    var cfg = window.FLOWER_CONFIG;

    /**
     * 获取可选花种列表（排除不可播种的花种）
     * @returns {Array} 可选花种配置数组
     */
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

    /**
     * 根据ID获取交易道具配置
     * @param {string} id - 道具ID
     * @returns {Object|null} 道具配置对象，未找到返回null
     */
    function getTradeItemById(id) {
        for (var i = 0; i < cfg.TRADE_ITEMS.length; i++) {
            if (cfg.TRADE_ITEMS[i].id === id) {
                return cfg.TRADE_ITEMS[i];
            }
        }
        return null;
    }

    /**
     * 创建种子工具栏
     * 包含：各花种选择项、送给明星入口按钮
     * @param {Object} ctx - 共享上下文对象
     */
    function createSeedToolbar(ctx) {
        var seedToolbar = document.getElementById('seed-toolbar');
        if (!seedToolbar) {
            seedToolbar = document.createElement('div');
            seedToolbar.id = 'seed-toolbar';

            var seedFlowers = getSeedFlowerTypes();

            // 创建花种选择项
            for (var i = 0; i < seedFlowers.length; i++) {
                var flower = seedFlowers[i];
                var item = document.createElement('div');
                item.className = 'seed-item';
                item.setAttribute('data-flower-id', flower.id);
                item.innerHTML = '<img src="' + flower.logo + '" alt="' + flower.name + '"><div class="seed-name">' + flower.name + '</div>';
                item.addEventListener('click', function() {
                    var flowerId = this.getAttribute('data-flower-id');
                    if (typeof ctx.callbacks.onSeedSelect === 'function') {
                        ctx.callbacks.onSeedSelect(flowerId);
                    }
                });
                seedToolbar.appendChild(item);
            }

            document.body.appendChild(seedToolbar);
        }

        // 创建送给明星入口按钮
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

        // 缓存DOM引用
        ctx.refs.seedToolbar = seedToolbar;
        ctx.refs.stageDonateCard = stageDonateCard;
    }

    /**
     * 创建快捷操作按钮
     * 包含：一键施肥、一键浇水、一键播种、一键采摘
     * @param {Object} ctx - 共享上下文对象
     */
    function createQuickActionButtons(ctx) {
        // 一键施肥按钮
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
                if (typeof ctx.callbacks.onQuickFertilize === 'function') {
                    ctx.callbacks.onQuickFertilize();
                }
            };
            document.body.appendChild(quickFertilizeBtn);
        }

        // 一键浇水按钮
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
                if (typeof ctx.callbacks.onQuickWater === 'function') {
                    ctx.callbacks.onQuickWater();
                }
            };
            document.body.appendChild(quickWaterBtn);
        }

        // 一键播种按钮
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
                if (typeof ctx.callbacks.onQuickPlant === 'function') {
                    ctx.callbacks.onQuickPlant();
                }
            };
            document.body.appendChild(quickPlantBtn);
        }

        // 一键采摘按钮
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
                if (typeof ctx.callbacks.onQuickHarvest === 'function') {
                    ctx.callbacks.onQuickHarvest();
                }
            };
            document.body.appendChild(quickHarvestBtn);
        }

        // 缓存DOM引用
        ctx.refs.quickFertilizeBtn = quickFertilizeBtn;
        ctx.refs.quickWaterBtn = quickWaterBtn;
        ctx.refs.quickPlantBtn = quickPlantBtn;
        ctx.refs.quickHarvestBtn = quickHarvestBtn;
        ctx.refs.quickFertilizerCount = document.getElementById('quick-fertilizer-count');
        ctx.refs.quickWateringCount = document.getElementById('quick-watering-count');
        ctx.refs.quickPlantStatus = document.getElementById('quick-plant-status');
        ctx.refs.quickHarvestStatus = document.getElementById('quick-harvest-status');
    }

    /**
     * 渲染种子选中状态
     * 为当前选中的花种添加 .active 类
     * @param {Object} ctx - 共享上下文对象
     * @param {string} selectedFlowerType - 当前选中的花种ID
     */
    function renderSeedSelection(ctx, selectedFlowerType) {
        if (!ctx.refs.seedToolbar) {
            return;
        }

        var items = ctx.refs.seedToolbar.querySelectorAll('.seed-item');
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

    /**
     * 渲染快捷按钮状态
     * 更新道具数量显示、解锁状态、按钮禁用状态
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderQuickActionButtons(ctx, state) {
        if (!ctx.refs.quickFertilizeBtn || !ctx.refs.quickWaterBtn || !ctx.refs.quickPlantBtn || !ctx.refs.quickHarvestBtn) {
            return;
        }

        var fertilizerCount = (state.tools && state.tools.fertilizer) || 0;
        var wateringCount = (state.tools && state.tools.wateringCan) || 0;
        var plantUnlocked = !!(state.tools && state.tools.oneClickPlant);
        var harvestUnlocked = !!(state.tools && state.tools.oneClickHarvest);

        // 更新数量显示
        ctx.refs.quickFertilizerCount.textContent = 'x' + fertilizerCount;
        ctx.refs.quickWateringCount.textContent = 'x' + wateringCount;
        ctx.refs.quickPlantStatus.textContent = plantUnlocked ? '已解锁' : '未解锁';
        ctx.refs.quickHarvestStatus.textContent = harvestUnlocked ? '已解锁' : '未解锁';

        // 更新按钮禁用状态
        ctx.refs.quickFertilizeBtn.disabled = fertilizerCount <= 0;
        ctx.refs.quickWaterBtn.disabled = wateringCount <= 0;
        ctx.refs.quickPlantBtn.disabled = !plantUnlocked;
        ctx.refs.quickHarvestBtn.disabled = !harvestUnlocked;
    }

    /** 导出工具栏接口 */
    window.FlowerUIToolbar = {
        createSeedToolbar: createSeedToolbar,
        createQuickActions: createQuickActionButtons,
        renderSeedSelection: renderSeedSelection,
        renderQuickActions: renderQuickActionButtons
    };
})();
