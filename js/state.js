(function() {
    var cfg = window.FLOWER_CONFIG;
    var flowerTypeIds = cfg.FLOWER_TYPES.map(function(item) { return item.id; });
    var seedSelectableTypeIds = cfg.FLOWER_TYPES
        .filter(function(item) {
            return item.seedSelectable !== false;
        })
        .map(function(item) {
            return item.id;
        });

    function getDefaultWarehouse() {
        var warehouse = {};
        for (var i = 0; i < flowerTypeIds.length; i++) {
            warehouse[flowerTypeIds[i]] = 0;
        }
        return warehouse;
    }

    function getDefaultTools() {
        return {
            wateringCan: 0,
            fertilizer: 0,
            oneClickPlant: false,
            oneClickHarvest: false
        };
    }

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

    function getDefaultDailyTask() {
        return {
            dateKey: getTodayKey(),
            collectProgress: 0,
            rewardClaimed: false
        };
    }

    var state = {
        warehouse: getDefaultWarehouse(),
        level: 1,
        exp: 0,
        maxExp: cfg.LEVEL_UP_EXP,
        unlockedPotCount: cfg.BASE_UNLOCKED_POTS,
        selectedFlowerType: cfg.DEFAULT_FLOWER_TYPE,
        tools: getDefaultTools(),
        dailyTask: getDefaultDailyTask(),
        flowerPots: []
    };

    function getUnlockedPotCountByLevel(level) {
        return Math.min(cfg.BASE_UNLOCKED_POTS + Math.max(level - 1, 0), cfg.TOTAL_POTS);
    }

    function normalizeState() {
        state.level = Math.min(Math.max(state.level, 1), cfg.MAX_LEVEL);
        state.unlockedPotCount = Math.min(
            Math.max(state.unlockedPotCount, getUnlockedPotCountByLevel(state.level)),
            cfg.TOTAL_POTS
        );

        if (state.level >= cfg.MAX_LEVEL) {
            state.level = cfg.MAX_LEVEL;
            state.exp = state.maxExp;
            state.unlockedPotCount = cfg.TOTAL_POTS;
        } else {
            state.exp = Math.min(Math.max(state.exp, 0), state.maxExp - 1);
        }

        if (seedSelectableTypeIds.indexOf(state.selectedFlowerType) === -1) {
            state.selectedFlowerType = cfg.DEFAULT_FLOWER_TYPE;
        }

        if (!state.warehouse || typeof state.warehouse !== 'object') {
            state.warehouse = getDefaultWarehouse();
        }

        for (var i = 0; i < flowerTypeIds.length; i++) {
            var id = flowerTypeIds[i];
            var value = parseInt(state.warehouse[id], 10);
            state.warehouse[id] = isNaN(value) ? 0 : Math.max(value, 0);
        }

        if (!state.tools || typeof state.tools !== 'object') {
            state.tools = getDefaultTools();
        }

        var wateringCanCount = parseInt(state.tools.wateringCan, 10);
        var fertilizerCount = parseInt(state.tools.fertilizer, 10);
        state.tools.wateringCan = isNaN(wateringCanCount) ? 0 : Math.max(wateringCanCount, 0);
        state.tools.fertilizer = isNaN(fertilizerCount) ? 0 : Math.max(fertilizerCount, 0);

        state.tools.oneClickPlant = !!state.tools.oneClickPlant;
        state.tools.oneClickHarvest = !!state.tools.oneClickHarvest;

        if (!state.dailyTask || typeof state.dailyTask !== 'object') {
            state.dailyTask = getDefaultDailyTask();
        }

        var todayKey = getTodayKey();
        if (state.dailyTask.dateKey !== todayKey) {
            state.dailyTask = getDefaultDailyTask();
        }

        var collectProgress = parseInt(state.dailyTask.collectProgress, 10);
        state.dailyTask.collectProgress = isNaN(collectProgress) ? 0 : Math.max(collectProgress, 0);
        state.dailyTask.rewardClaimed = !!state.dailyTask.rewardClaimed;
    }

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

            var loadedLevel = parseInt(parsed.level, 10);
            if (!isNaN(loadedLevel)) {
                state.level = loadedLevel;
            }

            var loadedExp = parseInt(parsed.exp, 10);
            if (!isNaN(loadedExp)) {
                state.exp = loadedExp;
            }

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

            if (typeof parsed.selectedFlowerType === 'string') {
                state.selectedFlowerType = parsed.selectedFlowerType;
            }

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

            var loadedUnlocked = parseInt(parsed.unlockedPotCount, 10);
            if (!isNaN(loadedUnlocked)) {
                state.unlockedPotCount = loadedUnlocked;
            } else {
                state.unlockedPotCount = getUnlockedPotCountByLevel(state.level);
            }
        } catch (e) {
        }

        normalizeState();
    }

    function saveProgress() {
        try {
            localStorage.setItem(cfg.SAVE_KEY, JSON.stringify({
                level: state.level,
                exp: state.exp,
                warehouse: state.warehouse,
                warehouseRose: state.warehouse.rose || 0,
                selectedFlowerType: state.selectedFlowerType,
                unlockedPotCount: state.unlockedPotCount,
                tools: state.tools,
                dailyTask: state.dailyTask
            }));
        } catch (e) {
        }
    }

    window.FlowerState = state;
    window.FlowerStateService = {
        loadProgress: loadProgress,
        saveProgress: saveProgress,
        getUnlockedPotCountByLevel: getUnlockedPotCountByLevel
    };
})();
