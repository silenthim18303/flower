(function() {
    var cfg = window.FLOWER_CONFIG;
    var state = window.FlowerState;
    var stateService = window.FlowerStateService;
    var ui = window.FlowerUI;
    var bootLoading = document.getElementById('boot-loading');
    var bootLoadingProgressFill = document.getElementById('boot-loading-progress-fill');
    var bootLoadingProgressText = document.getElementById('boot-loading-progress-text');
    var MIN_BOOT_LOADING_MS = 1500;
    var bootLoadingShownAt = Date.now();
    var bootLoadingHideScheduled = false;

    var game = new Phaser.Game(360, 640, Phaser.AUTO, '', {
        preload: preload,
        create: create,
        update: update
    });

    function preload() {
        game.load.onFileComplete.add(updateBootLoadingProgress, this);
        updateBootLoadingProgress(0);

        game.load.image('background', 'img/背景/背景.png');
        game.load.image('pot', 'img/背景/花盆.png');
        game.load.image('potLocked', 'img/背景/未解锁花盆.png');
        game.load.image('house', 'img/背景/房子.png');
        game.load.image('npcFarmer', 'img/npc/花农.png');

        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flower = cfg.FLOWER_TYPES[i];
            for (var stage = 1; stage <= 5; stage++) {
                game.load.image(flower.id + stage, 'img/' + flower.folder + '/' + stage + '.png');
            }
        }
    }

    function updateBootLoadingProgress(progress) {
        if (!bootLoading) {
            return;
        }

        var safeProgress = Math.max(0, Math.min(100, progress || 0));
        if (bootLoadingProgressFill) {
            bootLoadingProgressFill.style.width = safeProgress + '%';
        }
        if (bootLoadingProgressText) {
            bootLoadingProgressText.textContent = Math.round(safeProgress) + '%';
        }
    }

    function hideBootLoading() {
        if (!bootLoading || bootLoadingHideScheduled) {
            return;
        }

        bootLoadingHideScheduled = true;

        var elapsed = Date.now() - bootLoadingShownAt;
        var waitBeforeHide = Math.max(0, MIN_BOOT_LOADING_MS - elapsed);

        setTimeout(function() {
            if (!bootLoading) {
                return;
            }

            updateBootLoadingProgress(100);
            bootLoading.classList.add('is-hidden');
            setTimeout(function() {
                if (bootLoading && bootLoading.parentNode) {
                    bootLoading.parentNode.removeChild(bootLoading);
                }
                try {
                    if (window.sessionStorage) {
                        sessionStorage.setItem('flower_boot_loaded', '1');
                    }
                } catch (e) {
                }
                bootLoading = null;
                bootLoadingProgressFill = null;
                bootLoadingProgressText = null;
            }, 320);
        }, waitBeforeHide);
    }

    function create() {
        game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.refresh();

        var bg = game.add.sprite(0, 0, 'background');
        function resizeBackground() {
            var img = game.cache.getImage('background');
            var scaleX = game.width / img.width;
            var scaleY = game.height / img.height;
            var scale = Math.max(scaleX, scaleY);
            bg.scale.setTo(scale);
            bg.x = (game.width - bg.width) / 2;
            bg.y = (game.height - bg.height) / 2;
        }
        resizeBackground();
        game.scale.onSizeChange.add(resizeBackground, this);

        var house = game.add.sprite(0, 0, 'house');
        house.anchor.setTo(0.5, 0.5);
        house.inputEnabled = true;
        house.input.useHandCursor = true;
        house.events.onInputDown.add(function() {
            ui.showCollectModal(state);
        });
        function positionHouse() {
            var houseImg = game.cache.getImage('house');
            var houseScale = (game.width / 1.2) / houseImg.width;
            house.scale.setTo(houseScale);
            house.x = game.width / 2;
            house.y = game.height * 2 / 5;
        }
        positionHouse();
        game.scale.onSizeChange.add(positionHouse, this);

        var npcFarmer = game.add.sprite(0, 0, 'npcFarmer');
        npcFarmer.anchor.setTo(0.5, 1);
        npcFarmer.inputEnabled = true;
        npcFarmer.input.useHandCursor = true;
        npcFarmer.events.onInputDown.add(function() {
            ui.showGoldenExchangeModal(state);
        });

        function positionFarmer() {
            var npcImg = game.cache.getImage('npcFarmer');
            if (!npcImg || !npcImg.width) {
                return;
            }

            var npcScale = (game.width / 5.5) / npcImg.width;
            npcFarmer.scale.setTo(npcScale);
            npcFarmer.x = house.x + house.width * 0.5;
            npcFarmer.y = house.y + house.height * 0.5;
        }
        positionFarmer();
        game.scale.onSizeChange.add(positionFarmer, this);

        stateService.loadProgress();
        ui.ensureUI();
        ui.setSeedSelectHandler(function(flowerId) {
            state.selectedFlowerType = flowerId;
            ui.render(state);
            stateService.saveProgress();
        });
        ui.setTradeHandler(function() {
            stateService.saveProgress();
        });
        ui.setDailyTaskClaimHandler(function() {
            if (!state.dailyTask || state.dailyTask.rewardClaimed) {
                return;
            }

            var taskCfg = cfg.DAILY_TASK || {};
            var goal = taskCfg.collectGoal || 0;
            if ((state.dailyTask.collectProgress || 0) < goal || goal <= 0) {
                return;
            }

            var reward = taskCfg.reward || {};
            if (!state.tools || typeof state.tools !== 'object') {
                state.tools = {};
            }

            state.tools.fertilizer = (state.tools.fertilizer || 0) + (reward.fertilizer || 0);
            state.tools.wateringCan = (state.tools.wateringCan || 0) + (reward.wateringCan || 0);
            state.dailyTask.rewardClaimed = true;

            ui.render(state);
            stateService.saveProgress();
        });
        ui.setQuickActionHandlers({
            onFertilize: function() {
                if (!state.tools || state.tools.fertilizer <= 0) {
                    return;
                }

                var changed = false;
                for (var i = 0; i < state.flowerPots.length; i++) {
                    if (state.flowerPots[i].growToFinalStage()) {
                        changed = true;
                    }
                }

                if (!changed) {
                    return;
                }

                state.tools.fertilizer--;
                ui.render(state);
                stateService.saveProgress();
            },
            onWater: function() {
                if (!state.tools || state.tools.wateringCan <= 0) {
                    return;
                }

                var changed = false;
                for (var i = 0; i < state.flowerPots.length; i++) {
                    if (state.flowerPots[i].growToNextStage()) {
                        changed = true;
                    }
                }

                if (!changed) {
                    return;
                }

                state.tools.wateringCan--;
                ui.render(state);
                stateService.saveProgress();
            },
            onPlant: function() {
                if (!state.tools || !state.tools.oneClickPlant) {
                    return;
                }

                var changed = false;
                for (var i = 0; i < state.flowerPots.length; i++) {
                    if (state.flowerPots[i].plantIfEmpty(state.selectedFlowerType)) {
                        changed = true;
                    }
                }

                if (!changed) {
                    return;
                }

                ui.render(state);
                stateService.saveProgress();
            },
            onHarvest: function() {
                if (!state.tools || !state.tools.oneClickHarvest) {
                    return;
                }

                var changed = false;
                for (var i = 0; i < state.flowerPots.length; i++) {
                    if (state.flowerPots[i].collectIfMature()) {
                        changed = true;
                    }
                }

                if (!changed) {
                    return;
                }

                ui.render(state);
                stateService.saveProgress();
            }
        });

        function applyUnlockedStateToPots() {
            for (var i = 0; i < state.flowerPots.length; i++) {
                state.flowerPots[i].setOperable(i < state.unlockedPotCount);
            }
        }

        function updateAllPots() {
            for (var i = 0; i < state.flowerPots.length; i++) {
                state.flowerPots[i].updatePosition();
            }
        }

        function handleCollect(flowerTypeId, count) {
            var typeId = flowerTypeId || cfg.DEFAULT_FLOWER_TYPE;
            if (typeof state.warehouse[typeId] !== 'number') {
                state.warehouse[typeId] = 0;
            }
            state.warehouse[typeId] += count;

            if (state.dailyTask && !state.dailyTask.rewardClaimed) {
                var taskGoal = (cfg.DAILY_TASK && cfg.DAILY_TASK.collectGoal) || 0;
                var currentProgress = state.dailyTask.collectProgress || 0;
                if (taskGoal > 0) {
                    state.dailyTask.collectProgress = Math.min(currentProgress + count, taskGoal);
                }
            }

            window.updateExp(count * cfg.EXP_PER_FLOWER);
        }

        window.updateExp = function(gain) {
            if (state.level >= cfg.MAX_LEVEL) {
                state.level = cfg.MAX_LEVEL;
                state.exp = state.maxExp;
                state.unlockedPotCount = cfg.TOTAL_POTS;
                applyUnlockedStateToPots();
                ui.render(state);
                stateService.saveProgress();
                return;
            }

            state.exp += gain;

            while (state.exp >= state.maxExp && state.level < cfg.MAX_LEVEL) {
                state.exp -= state.maxExp;
                state.level++;

                if (state.unlockedPotCount < cfg.TOTAL_POTS) {
                    state.unlockedPotCount++;
                    var unlockedIndex = state.unlockedPotCount - 1;
                    if (state.flowerPots[unlockedIndex]) {
                        state.flowerPots[unlockedIndex].setOperable(true);
                    }
                }

                if (state.level >= cfg.MAX_LEVEL) {
                    state.level = cfg.MAX_LEVEL;
                    state.exp = state.maxExp;
                    state.unlockedPotCount = cfg.TOTAL_POTS;
                    applyUnlockedStateToPots();
                    ui.showLevelUpToast(state.level, true);
                    break;
                }

                ui.showLevelUpToast(state.level, false);
            }

            ui.render(state);
            stateService.saveProgress();
        };

        var rows = 5;
        var cols = 4;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var pot = new FlowerPot(game, r, c, r * cols + c, {
                    onCollect: handleCollect,
                    getSelectedFlowerType: function() {
                        return state.selectedFlowerType;
                    }
                });
                state.flowerPots.push(pot);
            }
        }

        applyUnlockedStateToPots();
        updateAllPots();
        ui.render(state);
        stateService.saveProgress();
        hideBootLoading();

        game.scale.onSizeChange.add(updateAllPots, this);
    }

    function update() {
    }
})();
