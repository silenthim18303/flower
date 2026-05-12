(function() {
    var cfg = window.FLOWER_CONFIG;

    /** 所有花种ID列表 */
    var flowerTypeIds = cfg.FLOWER_TYPES.map(function(item) { return item.id; });

    /** 可手动播种的花种ID列表（排除金花等不可选花种） */
    var seedSelectableTypeIds = cfg.FLOWER_TYPES
        .filter(function(item) {
            return item.seedSelectable !== false;
        })
        .map(function(item) {
            return item.id;
        });

    /**
     * 获取默认仓库数据
     * @returns {Object} 各花种数量归零的仓库对象
     */
    function getDefaultWarehouse() {
        var warehouse = {};
        for (var i = 0; i < flowerTypeIds.length; i++) {
            warehouse[flowerTypeIds[i]] = 0;
        }
        return warehouse;
    }

    /**
     * 获取默认工具数据
     * @returns {Object} 工具数量/状态归零的对象
     */
    function getDefaultTools() {
        return {
            wateringCan: 0,       // 浇水壶数量
            fertilizer: 0,        // 化肥数量
            oneClickPlant: false, // 一键播种是否解锁
            oneClickHarvest: false // 一键采摘是否解锁
        };
    }

    /**
     * 获取今日日期键（格式：YYYY-MM-DD）
     * @returns {string} 日期字符串
     */
    function getTodayKey() {
        var now = new Date();
        var month = (now.getMonth() + 1).toString();
        var day = now.getDate().toString();
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        return now.getFullYear() + '-' + month + '-' + day;
    }

    /**
     * 获取默认每日任务数据
     * @returns {Object} 每日任务初始状态
     */
    function getDefaultDailyTask() {
        return {
            dateKey: getTodayKey(),  // 任务日期
            collectProgress: 0,      // 收花进度
            rewardClaimed: false     // 奖励是否已领取
        };
    }

    /**
     * 游戏状态对象（全局共享）
     * 所有游戏运行时数据存储在此
     */
    var state = {
        warehouse: getDefaultWarehouse(),  // 仓库（各花种数量）
        level: 1,                          // 当前等级
        exp: 0,                            // 当前经验值
        maxExp: cfg.LEVEL_UP_EXP,          // 升级所需经验
        unlockedPotCount: cfg.BASE_UNLOCKED_POTS, // 已解锁花盆数
        selectedFlowerType: cfg.DEFAULT_FLOWER_TYPE, // 当前选中的花种
        tools: getDefaultTools(),          // 工具状态
        dailyTask: getDefaultDailyTask(),  // 每日任务状态
        flowerPots: [],                    // 花盆游戏对象数组（运行时）
        potStages: [],                     // 花盆阶段存档数据
        potFlowerTypes: [],                // 花盆花种存档数据
        playerName: 'Player'               // 玩家昵称
    };

    /**
     * 根据等级计算已解锁花盆数量
     * @param {number} level - 当前等级
     * @returns {number} 已解锁花盆数量（不超过总数）
     */
    function getUnlockedPotCountByLevel(level) {
        return Math.min(cfg.BASE_UNLOCKED_POTS + Math.max(level - 1, 0), cfg.TOTAL_POTS);
    }

    /**
     * 规范化游戏状态
     * 确保所有数值在合法范围内，修复异常数据
     */
    function normalizeState() {
        // 等级限制在 1 ~ MAX_LEVEL
        state.level = Math.min(Math.max(state.level, 1), cfg.MAX_LEVEL);

        // 已解锁花盆数不能低于等级对应的数量，也不能超过总数
        state.unlockedPotCount = Math.min(
            Math.max(state.unlockedPotCount, getUnlockedPotCountByLevel(state.level)),
            cfg.TOTAL_POTS
        );

        // 满级处理：经验封顶，解锁全部花盆
        if (state.level >= cfg.MAX_LEVEL) {
            state.level = cfg.MAX_LEVEL;
            state.exp = state.maxExp;
            state.unlockedPotCount = cfg.TOTAL_POTS;
        } else {
            // 非满级时经验不能达到升级值（需留空间给下次升级）
            state.exp = Math.min(Math.max(state.exp, 0), state.maxExp - 1);
        }

        // 选中花种必须是可播种类型
        if (seedSelectableTypeIds.indexOf(state.selectedFlowerType) === -1) {
            state.selectedFlowerType = cfg.DEFAULT_FLOWER_TYPE;
        }

        // 仓库数据校验
        if (!state.warehouse || typeof state.warehouse !== 'object') {
            state.warehouse = getDefaultWarehouse();
        }

        // 各花种数量必须为非负整数
        for (var i = 0; i < flowerTypeIds.length; i++) {
            var id = flowerTypeIds[i];
            var value = parseInt(state.warehouse[id], 10);
            state.warehouse[id] = isNaN(value) ? 0 : Math.max(value, 0);
        }

        // 工具数据校验
        if (!state.tools || typeof state.tools !== 'object') {
            state.tools = getDefaultTools();
        }

        var wateringCanCount = parseInt(state.tools.wateringCan, 10);
        var fertilizerCount = parseInt(state.tools.fertilizer, 10);
        state.tools.wateringCan = isNaN(wateringCanCount) ? 0 : Math.max(wateringCanCount, 0);
        state.tools.fertilizer = isNaN(fertilizerCount) ? 0 : Math.max(fertilizerCount, 0);

        // 永久道具转布尔值
        state.tools.oneClickPlant = !!state.tools.oneClickPlant;
        state.tools.oneClickHarvest = !!state.tools.oneClickHarvest;

        // 每日任务数据校验
        if (!state.dailyTask || typeof state.dailyTask !== 'object') {
            state.dailyTask = getDefaultDailyTask();
        }

        // 日期变化时重置每日任务
        var todayKey = getTodayKey();
        if (state.dailyTask.dateKey !== todayKey) {
            state.dailyTask = getDefaultDailyTask();
        }

        var collectProgress = parseInt(state.dailyTask.collectProgress, 10);
        state.dailyTask.collectProgress = isNaN(collectProgress) ? 0 : Math.max(collectProgress, 0);
        state.dailyTask.rewardClaimed = !!state.dailyTask.rewardClaimed;
    }

    /**
     * 从 localStorage 加载游戏存档
     * 解析 JSON 数据并恢复到 state 对象
     */
    function loadProgress() {
        try {
            var raw = localStorage.getItem(cfg.SAVE_KEY);
            if (!raw) {
                normalizeState();
                return;
            }

            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') {
                normalizeState();
                return;
            }

            // 恢复等级
            var loadedLevel = parseInt(parsed.level, 10);
            if (!isNaN(loadedLevel)) {
                state.level = loadedLevel;
            }

            // 恢复经验值
            var loadedExp = parseInt(parsed.exp, 10);
            if (!isNaN(loadedExp)) {
                state.exp = loadedExp;
            }

            // 恢复仓库数据（兼容旧版格式）
            if (parsed.warehouse && typeof parsed.warehouse === 'object') {
                for (var i = 0; i < flowerTypeIds.length; i++) {
                    var flowerId = flowerTypeIds[i];
                    var loadedCount = parseInt(parsed.warehouse[flowerId], 10);
                    if (!isNaN(loadedCount)) {
                        state.warehouse[flowerId] = Math.max(loadedCount, 0);
                    }
                }
            } else {
                var loadedRose = parseInt(parsed.warehouseRose, 10);
                if (!isNaN(loadedRose)) {
                    state.warehouse.rose = Math.max(loadedRose, 0);
                }
            }

            // 恢复选中花种
            if (typeof parsed.selectedFlowerType === 'string') {
                state.selectedFlowerType = parsed.selectedFlowerType;
            }

            // 恢复玩家昵称（最多8字符）
            if (typeof parsed.playerName === 'string' && parsed.playerName.length > 0) {
                state.playerName = parsed.playerName.substring(0, 8);
            }

            // 恢复工具数据
            if (parsed.tools && typeof parsed.tools === 'object') {
                var loadedWateringCan = parseInt(parsed.tools.wateringCan, 10);
                var loadedFertilizer = parseInt(parsed.tools.fertilizer, 10);
                if (!isNaN(loadedWateringCan)) {
                    state.tools.wateringCan = Math.max(loadedWateringCan, 0);
                }
                if (!isNaN(loadedFertilizer)) {
                    state.tools.fertilizer = Math.max(loadedFertilizer, 0);
                }

                state.tools.oneClickPlant = !!parsed.tools.oneClickPlant;
                state.tools.oneClickHarvest = !!parsed.tools.oneClickHarvest;
            }

            // 恢复每日任务数据
            if (parsed.dailyTask && typeof parsed.dailyTask === 'object') {
                state.dailyTask.dateKey = typeof parsed.dailyTask.dateKey === 'string'
                    ? parsed.dailyTask.dateKey
                    : state.dailyTask.dateKey;

                var loadedProgress = parseInt(parsed.dailyTask.collectProgress, 10);
                if (!isNaN(loadedProgress)) {
                    state.dailyTask.collectProgress = Math.max(loadedProgress, 0);
                }

                state.dailyTask.rewardClaimed = !!parsed.dailyTask.rewardClaimed;
            }

            // 恢复已解锁花盆数
            var loadedUnlocked = parseInt(parsed.unlockedPotCount, 10);
            if (!isNaN(loadedUnlocked)) {
                state.unlockedPotCount = loadedUnlocked;
            } else {
                state.unlockedPotCount = getUnlockedPotCountByLevel(state.level);
            }

            // 恢复花盆状态（阶段和花种）
            if (Array.isArray(parsed.potStages)) {
                state.potStages = parsed.potStages;
            }
            if (Array.isArray(parsed.potFlowerTypes)) {
                state.potFlowerTypes = parsed.potFlowerTypes;
            }
        } catch (e) {
            // 解析失败时使用默认值
        }

        normalizeState();
    }

    /**
     * 保存游戏进度到 localStorage
     * 从 FlowerPot 对象读取花盆状态，合并到已有存档数据
     */
    function saveProgress() {
        // 从花盆游戏对象读取当前状态
        var potStages = null;
        var potFlowerTypes = null;
        if (state.flowerPots && state.flowerPots.length > 0) {
            potStages = [];
            potFlowerTypes = [];
            for (var i = 0; i < state.flowerPots.length; i++) {
                var pot = state.flowerPots[i];
                potStages.push(pot.currentStage);
                potFlowerTypes.push(pot.currentFlowerType || null);
            }
        }

        try {
            // 读取已有存档，合并写入（避免覆盖其他页面保存的数据）
            var raw = localStorage.getItem(cfg.SAVE_KEY);
            var existing = raw ? JSON.parse(raw) : {};
            if (!existing || typeof existing !== 'object') {
                existing = {};
            }

            // 更新存档字段
            existing.level = state.level;
            existing.exp = state.exp;
            existing.warehouse = state.warehouse;
            existing.warehouseRose = state.warehouse.rose || 0;
            existing.selectedFlowerType = state.selectedFlowerType;
            existing.unlockedPotCount = state.unlockedPotCount;
            existing.tools = state.tools;
            existing.dailyTask = state.dailyTask;
            existing.playerName = state.playerName;

            // 仅在游戏页面（有花盆对象）时更新花盆状态
            if (potStages !== null) {
                existing.potStages = potStages;
                existing.potFlowerTypes = potFlowerTypes;
            }

            localStorage.setItem(cfg.SAVE_KEY, JSON.stringify(existing));
        } catch (e) {
            // 存储失败时静默处理
        }
    }

    /** 导出游戏状态对象 */
    window.FlowerState = state;

    /** 导出状态服务接口 */
    window.FlowerStateService = {
        loadProgress: loadProgress,
        saveProgress: saveProgress,
        getUnlockedPotCountByLevel: getUnlockedPotCountByLevel
    };
})();
