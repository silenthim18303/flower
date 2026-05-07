(function() {
    var cfg = window.FLOWER_CONFIG;

    function FlowerPot(game, row, col, index, options) {
        this.game = game;
        this.row = row;
        this.col = col;
        this.index = index;
        this.onCollect = options && options.onCollect;
        this.getSelectedFlowerType = options && options.getSelectedFlowerType;

        var potImg = game.cache.getImage('pot');
        this.potOriginalWidth = potImg.width;
        this.potOriginalHeight = potImg.height;

        this.group = game.add.group();
        this.sprite = this.group.create(0, 0, 'pot');
        this.sprite.anchor.setTo(0.5, 0.5);

        var potScale = (game.width / 6) / this.potOriginalWidth;
        this.sprite.scale.setTo(-potScale, potScale);

        this.setOperable(index < cfg.BASE_UNLOCKED_POTS);

        this.growthStages = [];
        this.stageSprites = [];
        this.currentStage = -1;
        this.currentFlowerType = null;

        this.stageOffsets = cfg.ROSE_STAGE_OFFSETS.map(function(item) {
            return { x: item.x, y: item.y };
        });
        this.stageScaleFactors = cfg.ROSE_STAGE_SCALE_FACTORS.slice();
        this.growthTimer = null;
        this.revealEvent = null;

        this.sprite.inputEnabled = true;
        this.sprite.events.onInputDown.add(this.handleClick, this);
    }

    FlowerPot.prototype.setOperable = function(operable) {
        this.isOperable = operable;
        this.sprite.tint = operable ? 0xffffff : 0x000000;
    };

    FlowerPot.prototype.handleClick = function() {
        if (!this.isOperable) {
            return;
        }

        if (this.currentStage === -1) {
            var selectedFlowerType = typeof this.getSelectedFlowerType === 'function'
                ? this.getSelectedFlowerType()
                : cfg.DEFAULT_FLOWER_TYPE;
            this.plantSeed(selectedFlowerType);
            return;
        }

        if (this.currentStage === this.growthStages.length - 1) {
            this.collectFlower();
        }
    };

    FlowerPot.prototype.plantSeed = function(flowerTypeId) {
        this.currentFlowerType = flowerTypeId || cfg.DEFAULT_FLOWER_TYPE;
        this.growthStages = [
            this.currentFlowerType + '1',
            this.currentFlowerType + '2',
            this.currentFlowerType + '3',
            this.currentFlowerType + '4',
            this.currentFlowerType + '5'
        ];

        var potScale = (this.game.width / 6) / this.potOriginalWidth;

        for (var i = 0; i < this.growthStages.length; i++) {
            var sprite = this.group.create(0, 0, this.growthStages[i]);
            sprite.visible = false;
            sprite.anchor.setTo(0.5, 0.5);
            sprite.inputEnabled = true;
            sprite.events.onInputDown.add(this.handleClick, this);

            var scaleFactor = this.stageScaleFactors[i];
            sprite.scale.setTo(-potScale * scaleFactor, potScale * scaleFactor);

            var offset = this.stageOffsets[i];
            sprite.x = offset.x;
            sprite.y = offset.y;
            this.stageSprites.push(sprite);
        }

        this.syncStageTransforms();
        this.currentStage = 0;
        this.showStageSafely(0);
        this.startGrowing();
    };

    FlowerPot.prototype.startGrowing = function() {
        this.growthTimer = this.game.time.create(false);
        this.growthTimer.loop(10000, this.advanceGrowth, this);
        this.growthTimer.start();
    };

    FlowerPot.prototype.advanceGrowth = function() {
        if (this.currentStage >= this.growthStages.length - 1) {
            this.stopGrowing();
            return;
        }

        this.stageSprites[this.currentStage].visible = false;
        this.currentStage++;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
    };

    FlowerPot.prototype.growToNextStage = function() {
        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return false;
        }

        this.stageSprites[this.currentStage].visible = false;
        this.currentStage++;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);

        if (this.currentStage >= this.growthStages.length - 1) {
            this.stopGrowing();
        }

        return true;
    };

    FlowerPot.prototype.growToFinalStage = function() {
        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return false;
        }

        this.stageSprites[this.currentStage].visible = false;
        this.currentStage = this.growthStages.length - 1;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
        this.stopGrowing();
        return true;
    };

    FlowerPot.prototype.stopGrowing = function() {
        if (this.growthTimer) {
            this.growthTimer.stop();
            this.growthTimer.destroy();
            this.growthTimer = null;
        }
    };

    FlowerPot.prototype.collectFlower = function() {
        var count = Math.floor(Math.random() * 3) + 1;
        if (typeof this.onCollect === 'function') {
            this.onCollect(this.currentFlowerType || cfg.DEFAULT_FLOWER_TYPE, count);
        }
        this.showCollectTip(count);
        this.resetPot();
    };

    FlowerPot.prototype.showCollectTip = function(count) {
        var tipText = this.game.add.text(this.group.x, this.group.y - 70, '+' + count + '朵花', {
            font: 'bold 20px Microsoft YaHei',
            fill: '#fff5d6',
            stroke: '#2a5d2f',
            strokeThickness: 4
        });
        tipText.anchor.setTo(0.5, 0.5);

        var tween = this.game.add.tween(tipText).to({
            y: tipText.y - 35,
            alpha: 0
        }, 650, Phaser.Easing.Cubic.Out, true);

        tween.onComplete.add(function() {
            tipText.destroy();
        });
    };

    FlowerPot.prototype.resetPot = function() {
        this.stopGrowing();

        if (this.revealEvent) {
            this.game.time.events.remove(this.revealEvent);
            this.revealEvent = null;
        }

        for (var i = 0; i < this.stageSprites.length; i++) {
            this.stageSprites[i].destroy();
        }

        this.stageSprites = [];
        this.currentStage = -1;
        this.currentFlowerType = null;
    };

    FlowerPot.prototype.showStageSafely = function(stageIndex) {
        if (stageIndex < 0 || stageIndex >= this.stageSprites.length) {
            return;
        }

        for (var i = 0; i < this.stageSprites.length; i++) {
            this.stageSprites[i].visible = false;
        }

        this.syncStageTransforms();

        if (this.revealEvent) {
            this.game.time.events.remove(this.revealEvent);
            this.revealEvent = null;
        }

        this.revealEvent = this.game.time.events.add(16, function() {
            this.revealEvent = null;

            if (this.currentStage !== stageIndex) {
                return;
            }

            if (stageIndex >= 0 && stageIndex < this.stageSprites.length) {
                this.stageSprites[stageIndex].visible = true;
            }
        }, this);
    };

    FlowerPot.prototype.syncStageTransforms = function() {
        var potScale = (this.game.width / 6) / this.potOriginalWidth;

        for (var i = 0; i < this.stageSprites.length; i++) {
            var stageSprite = this.stageSprites[i];
            var stageOffset = this.stageOffsets[i];
            var stageScaleFactor = this.stageScaleFactors[i];
            stageSprite.x = stageOffset.x;
            stageSprite.y = stageOffset.y;
            stageSprite.scale.setTo(-potScale * stageScaleFactor, potScale * stageScaleFactor);
        }
    };

    FlowerPot.prototype.updatePosition = function() {
        var newPotScale = (this.game.width / 6) / this.potOriginalWidth;
        var newPotWidth = this.potOriginalWidth * newPotScale;

        var yStart = this.game.height * 0.6;
        var yEnd = this.game.height * 0.8;
        var rowHeight = (yEnd - yStart) / 4;

        var horizontalSpacing = newPotWidth * 1.2;
        var offsetX = newPotWidth * 0.3;

        this.sprite.scale.setTo(-newPotScale, newPotScale);

        var y = yStart + this.row * rowHeight;
        var baseX = this.game.width * 0.5 - (4 * horizontalSpacing) / 2;
        var x = baseX + this.col * horizontalSpacing + this.row * offsetX;

        this.group.x = x;
        this.group.y = y;

        this.syncStageTransforms();
    };

    window.FlowerPot = FlowerPot;
})();
