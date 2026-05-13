/**
 * 花盆游戏对象模块
 * 管理单个花盆的生命周期：播种、生长、突变、收获、重置
 *
 * 每个花盆包含：
 * - 花盆底座精灵（pot / potLocked）
 * - 花朵生长阶段精灵（5个阶段）
 * - 生长计时器
 * - 显示动画
 */
(function() {
    var cfg = window.FLOWER_CONFIG;

    /**
     * 花盆构造函数
     * 创建花盆容器、底座精灵，绑定点击事件
     *
     * @param {Phaser.Scene} scene - Phaser场景对象
     * @param {number} row - 花盆所在行（0-4）
     * @param {number} col - 花盆所在列（0-3）
     * @param {number} index - 花盆索引（0-19）
     * @param {Object} options - 配置选项
     * @param {Function} options.onCollect - 收获回调，参数 (flowerTypeId, count)
     * @param {Function} options.getSelectedFlowerType - 获取当前选中花种的回调
     */
    function FlowerPot(scene, row, col, index, options) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.index = index;
        this.onCollect = options && options.onCollect;
        this.getSelectedFlowerType = options && options.getSelectedFlowerType;

        // 获取花盆原始尺寸
        var potTexture = scene.textures.get('pot');
        var potSource = potTexture.getSourceImage();
        this.potOriginalWidth = potSource.width;
        this.potOriginalHeight = potSource.height;

        // 创建容器（用于整体定位）
        this.container = scene.add.container(0, 0);

        // 创建花盆底座精灵
        this.sprite = scene.add.image(0, 0, 'pot');
        this.sprite.setOrigin(0.5, 0.5);

        // 计算花盆缩放比例（屏幕宽度的1/6）
        var potScale = (scene.scale.width / 6) / this.potOriginalWidth;
        this.sprite.setScale(-potScale, potScale);  // 水平翻转

        this.container.add(this.sprite);

        // 设置初始可操作状态
        this.setOperable(index < cfg.BASE_UNLOCKED_POTS);

        // 花朵状态
        this.growthStages = [];      // 生长阶段纹理键名数组
        this.stageSprites = [];      // 各阶段精灵数组
        this.currentStage = -1;      // 当前阶段（-1=空，0-4=生长阶段）
        this.currentFlowerType = null; // 当前花种ID

        // 显示参数
        this.stageScaleFactors = cfg.ROSE_STAGE_SCALE_FACTORS.slice(); // 各阶段缩放因子
        this.flowerTopOffsetRatio = 0.20;  // 花朵顶部偏移比例

        // 动画状态
        this.growthEvent = null;     // 生长计时器
        this.revealEvent = null;     // 显示延迟事件
        this.revealTween = null;     // 显示渐变动画

        // 绑定点击事件
        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.on('pointerdown', this.handleClick, this);
    }

    /**
     * 设置花盆可操作状态
     * 切换花盆纹理（已解锁/未解锁）
     * @param {boolean} operable - 是否可操作
     */
    FlowerPot.prototype.setOperable = function(operable) {
        this.isOperable = operable;
        this.sprite.setTexture(operable ? 'pot' : 'potLocked');
        this.sprite.clearTint();
        this.sprite.setAlpha(1);
    };

    /**
     * 处理花盆点击事件
     * 空花盆：播种当前选中花种
     * 成熟花朵：收获
     */
    FlowerPot.prototype.handleClick = function() {
        if (!this.isOperable) {
            return;
        }

        // 空花盆 -> 播种
        if (this.currentStage === -1) {
            var selectedFlowerType = typeof this.getSelectedFlowerType === 'function'
                ? this.getSelectedFlowerType()
                : cfg.DEFAULT_FLOWER_TYPE;
            this.plantSeed(selectedFlowerType);
            return;
        }

        // 成熟花朵 -> 收获
        if (this.currentStage === this.growthStages.length - 1) {
            this.collectFlower();
        }
    };

    /**
     * 播种
     * 设置花种、创建阶段精灵、显示第一阶段、启动生长计时器
     * @param {string} flowerTypeId - 花种ID
     */
    FlowerPot.prototype.plantSeed = function(flowerTypeId) {
        this.currentFlowerType = flowerTypeId || cfg.DEFAULT_FLOWER_TYPE;
        this.growthStages = this.buildGrowthStageKeys(this.currentFlowerType);
        this.createStageSprites();

        this.syncStageTransforms();
        this.currentStage = 0;
        this.showStageSafely(0);
        this.startGrowing();
        
        // 播放播种音效
        if (window.FlowerGameSoundEffects && window.FlowerGameSoundEffects.planting) {
            window.FlowerGameSoundEffects.planting.play();
        }
    };

    /**
     * 构建花种各阶段的纹理键名
     * @param {string} flowerTypeId - 花种ID
     * @returns {string[]} 5个阶段的纹理键名数组
     */
    FlowerPot.prototype.buildGrowthStageKeys = function(flowerTypeId) {
        return [
            flowerTypeId + '1',
            flowerTypeId + '2',
            flowerTypeId + '3',
            flowerTypeId + '4',
            flowerTypeId + '5'
        ];
    };

    /**
     * 创建花朵阶段精灵
     * 为每个生长阶段创建一个精灵，初始隐藏
     */
    FlowerPot.prototype.createStageSprites = function() {
        var potScale = (this.scene.scale.width / 6) / this.potOriginalWidth;

        for (var i = 0; i < this.growthStages.length; i++) {
            var sprite = this.scene.add.image(0, 0, this.growthStages[i]);
            sprite.setVisible(false);
            sprite.setOrigin(0.5, 0.5);
            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', this.handleClick, this);

            var scaleFactor = this.stageScaleFactors[i];
            sprite.setScale(-potScale * scaleFactor, potScale * scaleFactor);

            sprite.x = 0;
            sprite.y = 0;
            this.container.add(sprite);
            this.stageSprites.push(sprite);
        }
    };

    /**
     * 启动生长计时器
     * 延迟随机时间后推进到下一阶段，循环直到成熟
     */
    FlowerPot.prototype.startGrowing = function() {
        var self = this;
        var delay = this.getRandomGrowthDelay();
        this.growthEvent = this.scene.time.delayedCall(delay, function() {
            self.growthEvent = null;
            self.advanceGrowth();

            // 未成熟则继续生长
            if (self.currentStage >= 0 && self.currentStage < self.growthStages.length - 1) {
                self.startGrowing();
            }
        });
    };

    /**
     * 获取随机生长延迟时间
     * @returns {number} 延迟毫秒数（10000-15000）
     */
    FlowerPot.prototype.getRandomGrowthDelay = function() {
        return Phaser.Math.Between(10000, 15000);
    };

    /**
     * 自然推进生长阶段
     * 尝试突变，隐藏当前阶段，显示下一阶段
     */
    FlowerPot.prototype.advanceGrowth = function() {
        if (this.currentStage >= this.growthStages.length - 1) {
            this.stopGrowing();
            return;
        }

        this.tryMutateToGolden();

        this.stageSprites[this.currentStage].setVisible(false);
        this.currentStage++;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
        
        // 播放生长音效
        if (window.FlowerGameSoundEffects && window.FlowerGameSoundEffects.growup) {
            window.FlowerGameSoundEffects.growup.play();
        }
    };

    /**
     * 一键浇水：前进一个阶段
     * @returns {boolean} 是否成功推进
     */
    FlowerPot.prototype.growToNextStage = function() {
        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return false;
        }

        this.tryMutateToGolden();

        this.stageSprites[this.currentStage].setVisible(false);
        this.currentStage++;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);

        if (this.currentStage >= this.growthStages.length - 1) {
            this.stopGrowing();
        }
        
        // 播放生长音效
        if (window.FlowerGameSoundEffects && window.FlowerGameSoundEffects.growup) {
            window.FlowerGameSoundEffects.growup.play();
        }

        return true;
    };

    /**
     * 一键施肥：直接跳到最终阶段
     * @returns {boolean} 是否成功推进
     */
    FlowerPot.prototype.growToFinalStage = function() {
        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return false;
        }

        this.tryMutateToGolden();

        this.stageSprites[this.currentStage].setVisible(false);
        this.currentStage = this.growthStages.length - 1;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
        this.stopGrowing();
        
        // 播放生长音效
        if (window.FlowerGameSoundEffects && window.FlowerGameSoundEffects.growup) {
            window.FlowerGameSoundEffects.growup.play();
        }
        
        return true;
    };

    /**
     * 一键播种：如果花盆为空则播种
     * @param {string} flowerTypeId - 花种ID
     * @returns {boolean} 是否成功播种
     */
    FlowerPot.prototype.plantIfEmpty = function(flowerTypeId) {
        if (!this.isOperable || this.currentStage !== -1) {
            return false;
        }

        this.plantSeed(flowerTypeId || cfg.DEFAULT_FLOWER_TYPE);
        return true;
    };

    /**
     * 一键采摘：如果花朵成熟则收获
     * @returns {boolean} 是否成功收获
     */
    FlowerPot.prototype.collectIfMature = function() {
        if (!this.isOperable || this.currentStage < 0) {
            return false;
        }

        if (this.currentStage !== this.growthStages.length - 1) {
            return false;
        }

        this.collectFlower();
        return true;
    };

    /**
     * 停止生长计时器
     */
    FlowerPot.prototype.stopGrowing = function() {
        if (this.growthEvent) {
            this.growthEvent.remove();
            this.growthEvent = null;
        }
    };

    /**
     * 收获花朵
     * 普通花：随机1-3朵
     * 金花：10朵牡丹 + 1朵金花
     * 收获后重置花盆
     */
    FlowerPot.prototype.collectFlower = function() {
        var mutationCfg = cfg.MUTATION || {};
        var peonyTypeId = mutationCfg.peonyTypeId || 'peony';
        var goldenTypeId = mutationCfg.goldenTypeId || 'golden';

        // 金花特殊收获
        if (this.currentFlowerType === goldenTypeId) {
            if (typeof this.onCollect === 'function') {
                this.onCollect(peonyTypeId, 10);
                this.onCollect(goldenTypeId, 1);
            }
            this.showCollectTip('+10朵牡丹 +1朵金花');
            this.resetPot();
            return;
        }

        // 普通花随机1-3朵
        var count = Math.floor(Math.random() * 3) + 1;
        if (typeof this.onCollect === 'function') {
            this.onCollect(this.currentFlowerType || cfg.DEFAULT_FLOWER_TYPE, count);
        }
        this.showCollectTip('+' + count + '朵花');
        this.resetPot();
    };

    /**
     * 显示收获提示文字（向上飘动消失）
     * @param {string} text - 提示文字
     */
    FlowerPot.prototype.showCollectTip = function(text) {
        var tipText = this.scene.add.text(this.container.x, this.container.y - 70, text, {
            fontFamily: 'Microsoft YaHei',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff5d6',
            stroke: '#2a5d2f',
            strokeThickness: 4
        });
        tipText.setOrigin(0.5, 0.5);

        // 向上飘动并渐隐
        this.scene.tweens.add({
            targets: tipText,
            y: tipText.y - 35,
            alpha: 0,
            duration: 650,
            ease: 'Cubic.easeOut',
            onComplete: function() {
                tipText.destroy();
            }
        });
    };

    /**
     * 尝试将牡丹突变为金花
     * 仅牡丹在非最终阶段时有概率触发
     */
    FlowerPot.prototype.tryMutateToGolden = function() {
        var mutationCfg = cfg.MUTATION || {};
        var peonyTypeId = mutationCfg.peonyTypeId || 'peony';
        var goldenTypeId = mutationCfg.goldenTypeId || 'golden';
        var chance = mutationCfg.peonyToGoldenChance || 0;

        // 仅牡丹可突变
        if (this.currentFlowerType !== peonyTypeId) {
            return;
        }

        // 最终阶段不突变
        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return;
        }

        // 概率判定
        if (Math.random() >= chance) {
            return;
        }

        this.mutateFlowerType(goldenTypeId);
    };

    /**
     * 执行花种突变
     * 销毁当前阶段精灵，创建新花种精灵，保持当前阶段
     * @param {string} nextFlowerTypeId - 目标花种ID
     */
    FlowerPot.prototype.mutateFlowerType = function(nextFlowerTypeId) {
        var stageIndex = this.currentStage;

        // 销毁旧精灵
        for (var i = 0; i < this.stageSprites.length; i++) {
            this.stageSprites[i].destroy();
        }

        // 创建新花种精灵
        this.stageSprites = [];
        this.currentFlowerType = nextFlowerTypeId;
        this.growthStages = this.buildGrowthStageKeys(nextFlowerTypeId);
        this.createStageSprites();

        // 恢复到突变前的阶段
        this.currentStage = Math.min(stageIndex, this.growthStages.length - 1);
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
    };

    /**
     * 重置花盆为空状态
     * 停止计时器，销毁所有花朵精灵
     */
    FlowerPot.prototype.resetPot = function() {
        this.stopGrowing();

        if (this.revealEvent) {
            this.revealEvent.remove();
            this.revealEvent = null;
        }

        if (this.revealTween) {
            this.revealTween.stop();
            this.revealTween = null;
        }

        for (var i = 0; i < this.stageSprites.length; i++) {
            this.stageSprites[i].destroy();
        }

        this.stageSprites = [];
        this.currentStage = -1;
        this.currentFlowerType = null;
    };

    /**
     * 安全显示指定阶段精灵
     * 隐藏所有阶段，延迟后渐显目标阶段
     * @param {number} stageIndex - 要显示的阶段索引
     */
    FlowerPot.prototype.showStageSafely = function(stageIndex) {
        if (stageIndex < 0 || stageIndex >= this.stageSprites.length) {
            return;
        }

        // 隐藏所有阶段
        for (var i = 0; i < this.stageSprites.length; i++) {
            this.stageSprites[i].setVisible(false);
        }

        this.syncStageTransforms();

        // 清除未完成的动画
        if (this.revealEvent) {
            this.revealEvent.remove();
            this.revealEvent = null;
        }

        if (this.revealTween) {
            this.revealTween.stop();
            this.revealTween = null;
        }

        // 延迟后渐显（避免闪烁）
        var self = this;
        this.revealEvent = this.scene.time.delayedCall(100, function() {
            self.revealEvent = null;

            if (self.currentStage !== stageIndex) {
                return;
            }

            if (stageIndex >= 0 && stageIndex < self.stageSprites.length) {
                var currentSprite = self.stageSprites[stageIndex];
                currentSprite.setAlpha(0);
                currentSprite.setVisible(true);
                self.revealTween = self.scene.tweens.add({
                    targets: currentSprite,
                    alpha: 1,
                    duration: 220,
                    ease: 'Cubic.easeOut',
                    onComplete: function() {
                        self.revealTween = null;
                    }
                });
            }
        });
    };

    /**
     * 同步花朵阶段精灵的缩放和位置
     * 根据花盆尺寸和阶段缩放因子调整
     */
    FlowerPot.prototype.syncStageTransforms = function() {
        var potScale = (this.scene.scale.width / 6) / this.potOriginalWidth;
        var potHeight = this.potOriginalHeight * potScale;

        for (var i = 0; i < this.stageSprites.length; i++) {
            var stageSprite = this.stageSprites[i];
            var stageScaleFactor = this.stageScaleFactors[i];
            stageSprite.setScale(-potScale * stageScaleFactor, potScale * stageScaleFactor);

            // 计算花朵位置（相对于花盆顶部）
            var stageHeight = stageSprite.displayHeight;
            var topOffset = potHeight * this.flowerTopOffsetRatio;
            stageSprite.x = 0;
            stageSprite.y = -(potHeight / 2) + topOffset - (stageHeight / 2);
        }
    };

    /**
     * 更新花盆位置（窗口大小变化时调用）
     * 根据网格布局重新计算位置
     */
    FlowerPot.prototype.updatePosition = function() {
        var newPotScale = (this.scene.scale.width / 6) / this.potOriginalWidth;
        var newPotWidth = this.potOriginalWidth * newPotScale;

        // 计算网格布局
        var yStart = this.scene.scale.height * 0.6;
        var yEnd = this.scene.scale.height * 0.8;
        var rowHeight = (yEnd - yStart) / 4;

        var horizontalSpacing = newPotWidth * 1.2;
        var offsetX = newPotWidth * 0.3;

        this.sprite.setScale(-newPotScale, newPotScale);

        // 计算花盆在网格中的位置
        var y = yStart + this.row * rowHeight;
        var baseX = this.scene.scale.width * 0.5 - (4 * horizontalSpacing) / 2;
        var x = baseX + this.col * horizontalSpacing + this.row * offsetX;

        this.container.x = x;
        this.container.y = y;

        this.syncStageTransforms();
    };

    /**
     * 恢复花盆状态（从存档加载）
     * 创建精灵并设置到指定阶段，如果未成熟则启动生长
     * @param {string} flowerType - 花种ID
     * @param {number} stage - 生长阶段（0-4）
     */
    FlowerPot.prototype.restoreState = function(flowerType, stage) {
        if (!flowerType || stage < 0) {
            return;
        }

        this.currentFlowerType = flowerType;
        this.growthStages = this.buildGrowthStageKeys(flowerType);
        this.createStageSprites();
        this.syncStageTransforms();

        this.currentStage = Math.min(stage, this.growthStages.length - 1);
        this.showStageSafely(this.currentStage);

        // 未成熟则继续生长
        if (this.currentStage < this.growthStages.length - 1) {
            this.startGrowing();
        }
    };

    /** 导出花盆类 */
    window.FlowerPot = FlowerPot;
})();
