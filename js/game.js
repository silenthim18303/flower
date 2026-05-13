/**
 * 游戏主入口模块
 * 负责：
 * - Phaser 3 游戏初始化
 * - 场景预加载（图片资源）
 * - 场景创建（背景、房子、NPC、花盆）
 * - UI事件绑定
 * - 经验/升级系统
 * - 启动加载页
 * - 页面离开自动保存
 */
(function() {
    var cfg = window.FLOWER_CONFIG;
    var state = window.FlowerState;
    var stateService = window.FlowerStateService;
    var ui = window.FlowerUI;

    // 启动加载页元素
    var bootLoading = document.getElementById('boot-loading');
    var bootLoadingProgressFill = document.getElementById('boot-loading-progress-fill');
    var bootLoadingProgressText = document.getElementById('boot-loading-progress-text');

    /** 加载页最少显示时间（毫秒） */
    var MIN_BOOT_LOADING_MS = 1500;

    /** 加载页开始显示时间 */
    var bootLoadingShownAt = Date.now();

    /** 加载页是否已调度隐藏 */
    var bootLoadingHideScheduled = false;

    // 禁用右键菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    /**
     * 游戏主场景
     * Phaser 3 Scene 类，包含 preload/create/update 生命周期
     */
    var FlowerScene = new Phaser.Class({
        Extends: Phaser.Scene,

        initialize: function FlowerScene() {
            Phaser.Scene.call(this, { key: 'FlowerScene' });
        },

        /**
         * 预加载资源
         * 加载所有图片资源，更新加载进度条
         */
        preload: function() {
            var self = this;

            // 监听加载进度
            this.load.on('progress', function(value) {
                updateBootLoadingProgress(Math.round(value * 100));
            });
            updateBootLoadingProgress(0);

            // 加载背景和UI资源
            this.load.image('background', 'img/背景/背景.png', { scale: 1 });
            this.load.image('pot', 'img/背景/花盆.png', { scale: 1 });
            this.load.image('potLocked', 'img/背景/未解锁花盆.png', { scale: 1 });
            this.load.image('house', 'img/背景/房子.png', { scale: 1 });
            this.load.image('npcFarmer', 'img/npc/花农2.png', { scale: 1 });
            this.load.image('npcFairy', 'img/npc/花仙子.png', { scale: 1 });

            // 加载各花种5个阶段的图片
            for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
                var flower = cfg.FLOWER_TYPES[i];
                for (var stage = 1; stage <= 5; stage++) {
                    this.load.image(flower.id + stage, 'img/' + flower.folder + '/' + stage + '.png', { scale: 1 });
                }
            }
        },

        /**
         * 创建场景
         * 初始化背景、房子、NPC、花盆、UI绑定
         */
        create: function() {
            var self = this;
            var scene = this;
            
            // 启用纹理过滤，优化缩放质量
            this.textures.get('background').setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
            this.textures.get('pot').setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
            this.textures.get('potLocked').setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
            this.textures.get('house').setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
            this.textures.get('npcFarmer').setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
            this.textures.get('npcFairy').setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
            
            // 设置所有花朵纹理过滤
            for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
                var flower = cfg.FLOWER_TYPES[i];
                for (var stage = 1; stage <= 5; stage++) {
                    var texture = this.textures.get(flower.id + stage);
                    if (texture) {
                        texture.setFilter(Phaser.Textures.FilterMode.LINEAR, Phaser.Textures.FilterMode.LINEAR);
                    }
                }
            }

            // ========== 背景 ==========
            var bg = scene.add.image(0, 0, 'background');
            bg.setOrigin(0, 0);

            /**
             * 自适应背景大小（覆盖整个屏幕）
             */
            function resizeBackground() {
                var img = scene.textures.get('background').getSourceImage();
                var scaleX = scene.scale.width / img.width;
                var scaleY = scene.scale.height / img.height;
                var scale = Math.max(scaleX, scaleY);
                bg.setScale(scale);
                bg.x = (scene.scale.width - bg.displayWidth) / 2;
                bg.y = (scene.scale.height - bg.displayHeight) / 2;
            }
            resizeBackground();
            scene.scale.on('resize', resizeBackground);

            // ========== 房子（点击打开收花统计） ==========
            var houseImg = scene.textures.get('house').getSourceImage();
            var houseScale = (scene.scale.width / 1.2) / houseImg.width;
            var house = scene.add.image(
                scene.scale.width / 2 - (houseImg.width * houseScale) * 0.3,
                scene.scale.height * 2 / 5,
                'house'
            );
            house.setOrigin(0.5, 0.5);
            house.setScale(houseScale);
            house.setInteractive({ useHandCursor: true });
            house.on('pointerdown', function() {
                ui.showCollectModal(state);
            });

            /**
             * 更新房子位置（窗口大小变化时）
             */
            function positionHouse() {
                var hImg = scene.textures.get('house').getSourceImage();
                var hScale = (scene.scale.width / 1.2) / hImg.width;
                house.setScale(hScale);
                house.x = scene.scale.width / 2 - house.displayWidth * 0.3;
                house.y = scene.scale.height * 2 / 5;
            }

            // ========== 花农NPC（点击打开金花兑换） ==========
            var npcImg = scene.textures.get('npcFarmer').getSourceImage();
            var npcFarmer = scene.add.image(0, 0, 'npcFarmer');
            npcFarmer.setOrigin(0.5, 1);
            npcFarmer.setInteractive({ useHandCursor: true });
            npcFarmer.on('pointerdown', function() {
                ui.showGoldenExchangeModal(state);
            });

            /**
             * 更新花农位置（窗口大小变化时）
             * 放在左下角，距离底部10%高度
             */
            function positionFarmer() {
                var nImg = scene.textures.get('npcFarmer').getSourceImage();
                if (!nImg || !nImg.width) {
                    return;
                }

                var npcScale = (scene.scale.width / 5.5) / nImg.width;
                npcFarmer.setScale(npcScale * 1.2); // 放大20%
                npcFarmer.x = npcFarmer.displayWidth * 0.5 + 10;
                npcFarmer.y = scene.scale.height * 0.9;
            }
            positionFarmer();

            // ========== 花仙子NPC（点击打开帮助弹窗） ==========
            var npcFairy = scene.add.image(0, 0, 'npcFairy');
            npcFairy.setOrigin(0.5, 0.5);
            npcFairy.setInteractive({ useHandCursor: true });
            npcFairy.on('pointerdown', function() {
                ui.showHelpModal();
            });

            // 花仙子上下浮动动画
            scene.tweens.add({
                targets: npcFairy,
                y: '+=8',
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });

            /**
             * 更新花仙子位置（窗口大小变化时）
             * 使用屏幕百分比定位，方便手动调整
             * 调整 leftPct 和 topPct 即可改变位置
             */
            function positionFairy() {
                var fImg = scene.textures.get('npcFairy').getSourceImage();
                if (!fImg || !fImg.width) {
                    return;
                }

                var fairyScale = (scene.scale.width / 7) / fImg.width;
                npcFairy.setScale(fairyScale);

                // 手动调整这两个百分比值（0~1）
                var leftPct = 0.5;  // 距离左边 50%
                var topPct = 0.13;   // 距离顶部 13%

                npcFairy.x = scene.scale.width * leftPct;
                npcFairy.y = scene.scale.height * topPct;
            }
            positionFairy();

            // 窗口大小变化时更新所有元素位置
            scene.scale.on('resize', function() {
                positionHouse();
                positionFarmer();
                positionFairy();
                updateAllPots();
            });

            // ========== 加载游戏状态 ==========
            stateService.loadProgress();

            // ========== 初始化UI ==========
            ui.ensureUI();

            // 注册花种选择回调
            ui.setSeedSelectHandler(function(flowerId) {
                state.selectedFlowerType = flowerId;
                ui.render(state);
                stateService.saveProgress();
            });

            // 注册昵称修改回调
            ui.setNameChangeHandler(function(newName) {
                state.playerName = newName;
                stateService.saveProgress();
            });

            // 注册交易完成回调
            ui.setTradeHandler(function() {
                stateService.saveProgress();
            });

            // 注册领取每日任务奖励回调
            ui.setDailyTaskClaimHandler(function() {
                if (!state.dailyTask || state.dailyTask.rewardClaimed) {
                    return;
                }

                var taskCfg = cfg.DAILY_TASK || {};
                var goal = taskCfg.collectGoal || 0;
                if ((state.dailyTask.collectProgress || 0) < goal || goal <= 0) {
                    return;
                }

                // 发放奖励
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

            // 注册快捷操作回调
            ui.setQuickActionHandlers({
                /**
                 * 一键施肥：所有已种花朵直接成熟
                 * 消耗1个化肥
                 */
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

                /**
                 * 一键浇水：所有已种花朵前进一个阶段
                 * 消耗1个浇水壶
                 */
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

                /**
                 * 一键播种：所有空花盆播种当前选中花种
                 * 需永久解锁
                 */
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

                /**
                 * 一键采摘：采摘所有成熟花朵
                 * 需永久解锁
                 */
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

            // ========== 花盆管理函数 ==========

            /**
             * 应用解锁状态到所有花盆
             * 根据已解锁数量设置花盆可操作状态
             */
            function applyUnlockedStateToPots() {
                for (var i = 0; i < state.flowerPots.length; i++) {
                    state.flowerPots[i].setOperable(i < state.unlockedPotCount);
                }
            }

            /**
             * 更新所有花盆位置（窗口大小变化时）
             */
            function updateAllPots() {
                for (var i = 0; i < state.flowerPots.length; i++) {
                    state.flowerPots[i].updatePosition();
                }
            }

            /**
             * 处理花朵收获
             * 增加仓库数量、更新每日任务进度、增加经验值
             * @param {string} flowerTypeId - 花种ID
             * @param {number} count - 收获数量
             */
            function handleCollect(flowerTypeId, count) {
                var typeId = flowerTypeId || cfg.DEFAULT_FLOWER_TYPE;
                if (typeof state.warehouse[typeId] !== 'number') {
                    state.warehouse[typeId] = 0;
                }
                state.warehouse[typeId] += count;

                // 更新每日任务进度
                if (state.dailyTask && !state.dailyTask.rewardClaimed) {
                    var taskGoal = (cfg.DAILY_TASK && cfg.DAILY_TASK.collectGoal) || 0;
                    var currentProgress = state.dailyTask.collectProgress || 0;
                    if (taskGoal > 0) {
                        state.dailyTask.collectProgress = Math.min(currentProgress + count, taskGoal);
                    }
                }

                // 增加经验值
                window.updateExp(count * cfg.EXP_PER_FLOWER);
            }

            /**
             * 增加经验值并处理升级
             * 升级时解锁新花盆，满级时封顶
             * @param {number} gain - 获得的经验值
             */
            window.updateExp = function(gain) {
                // 满级处理
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

                // 循环处理多次升级
                while (state.exp >= state.maxExp && state.level < cfg.MAX_LEVEL) {
                    state.exp -= state.maxExp;
                    state.level++;

                    // 解锁新花盆
                    if (state.unlockedPotCount < cfg.TOTAL_POTS) {
                        state.unlockedPotCount++;
                        var unlockedIndex = state.unlockedPotCount - 1;
                        if (state.flowerPots[unlockedIndex]) {
                            state.flowerPots[unlockedIndex].setOperable(true);
                        }
                    }

                    // 满级处理
                    if (state.level >= cfg.MAX_LEVEL) {
                        state.level = cfg.MAX_LEVEL;
                        state.exp = state.maxExp;
                        state.unlockedPotCount = cfg.TOTAL_POTS;
                        applyUnlockedStateToPots();
                        ui.showLevelUpToast(state.level, true);
                        break;
                    }

                    // 显示升级提示
                    ui.showLevelUpToast(state.level, false);
                }

                ui.render(state);
                stateService.saveProgress();
            };

            // ========== 创建花盆（5行 x 4列） ==========
            var rows = 5;
            var cols = 4;
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var pot = new FlowerPot(scene, r, c, r * cols + c, {
                        onCollect: handleCollect,
                        getSelectedFlowerType: function() {
                            return state.selectedFlowerType;
                        }
                    });
                    state.flowerPots.push(pot);
                }
            }

            // 应用解锁状态并更新位置
            applyUnlockedStateToPots();
            updateAllPots();

            // ========== 恢复花盆存档状态 ==========
            var potStages = state.potStages || [];
            var potFlowerTypes = state.potFlowerTypes || [];
            for (var i = 0; i < state.flowerPots.length; i++) {
                var stage = potStages[i];
                var flowerType = potFlowerTypes[i];
                if (typeof stage === 'number' && stage >= 0 && flowerType) {
                    state.flowerPots[i].restoreState(flowerType, stage);
                }
            }

            // ========== 页面离开自动保存 ==========
            function savePotState() {
                stateService.saveProgress();
            }

            window.addEventListener('beforeunload', savePotState);
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') {
                    savePotState();
                }
            });

            // ========== 初始渲染并隐藏加载页 ==========
            ui.render(state);
            stateService.saveProgress();
            hideBootLoading();

            // ========== 非移动端设备提示 ==========
            setTimeout(function() {
                var ua = navigator.userAgent || '';
                var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                if (!isMobile) {
                    showDeviceWarning();
                }
            }, 2000);
        },

        /**
         * 游戏主循环（每帧调用）
         * 当前为空，游戏逻辑由事件驱动
         */
        update: function() {
        }
    });

    // ========== Phaser 3 游戏实例 ==========
    var game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 360,
        height: 640,
        parent: '',
        backgroundColor: '#000000',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            autoRound: false,  // 禁用自动取整，保持亚像素精度
            resolution: window.devicePixelRatio || 1  // 使用设备像素比
        },
        scene: [FlowerScene],
        render: {
            antialias: true,    // 启用抗锯齿
            antialiasGL: true,  // WebGL抗锯齿
            roundPixels: false,  // 允许亚像素渲染
            pixelArt: false,     // 关闭像素艺术模式
            preservePixelArt: false,  // 不保留像素艺术
            clearBeforeRender: true
        },
        canvasStyle: 'image-rendering: -moz-crisp-edges; image-rendering: -webkit-crisp-edges; image-rendering: pixelated; image-rendering: crisp-edges;'  // 优化图像渲染
    });

    // ========== 启动加载页函数 ==========

    /**
     * 更新加载进度条
     * @param {number} progress - 进度百分比（0-100）
     */
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

    /**
     * 隐藏启动加载页
     * 确保最少显示 MIN_BOOT_LOADING_MS 毫秒
     * 单次会话内仅显示一次（通过 sessionStorage 记录）
     */
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

            // 动画结束后移除DOM
            setTimeout(function() {
                if (bootLoading && bootLoading.parentNode) {
                    bootLoading.parentNode.removeChild(bootLoading);
                }

                // 记录已加载状态（单次会话内不再显示）
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

    /**
     * 显示设备不兼容警告弹窗
     * 游戏内自定义弹窗，非浏览器原生alert
     */
    function showDeviceWarning() {
        var modal = document.createElement('div');
        modal.id = 'device-warning-modal';
        modal.innerHTML = [
            '<div class="device-warning-mask"></div>',
            '<div class="device-warning-card">',
            '  <div class="device-warning-icon">&#9888;</div>',
            '  <div class="device-warning-title">温馨提示</div>',
            '  <div class="device-warning-text">建议使用手机游玩此设备，不同设备的分辨率不同，可能会严重影响到体验</div>',
            '  <button class="device-warning-btn" type="button">我知道了</button>',
            '</div>'
        ].join('');

        document.body.appendChild(modal);

        // 触发动画
        requestAnimationFrame(function() {
            modal.classList.add('show');
        });

        // 绑定关闭按钮
        var btn = modal.querySelector('.device-warning-btn');
        if (btn) {
            btn.onclick = function() {
                modal.classList.remove('show');
                modal.classList.add('closing');
                setTimeout(function() {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 220);
            };
        }
    }
})();
