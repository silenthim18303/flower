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

        this.stageScaleFactors = cfg.ROSE_STAGE_SCALE_FACTORS.slice();
        this.flowerTopOffsetRatio = 0.20;
        this.growthEvent = null;
        this.revealEvent = null;
        this.revealTween = null;

        this.sprite.inputEnabled = true;
        this.sprite.events.onInputDown.add(this.handleClick, this);
    }

    FlowerPot.prototype.setOperable = function(operable) {
        this.isOperable = operable;
        this.sprite.loadTexture(operable ? 'pot' : 'potLocked');
        this.sprite.tint = 0xffffff;
        this.sprite.alpha = 1;
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
        this.growthStages = this.buildGrowthStageKeys(this.currentFlowerType);
        this.createStageSprites();

        this.syncStageTransforms();
        this.currentStage = 0;
        this.showStageSafely(0);
        this.startGrowing();
    };

    FlowerPot.prototype.buildGrowthStageKeys = function(flowerTypeId) {
        return [
            flowerTypeId + '1',
            flowerTypeId + '2',
            flowerTypeId + '3',
            flowerTypeId + '4',
            flowerTypeId + '5'
        ];
    };

    FlowerPot.prototype.createStageSprites = function() {
        var potScale = (this.game.width / 6) / this.potOriginalWidth;

        for (var i = 0; i < this.growthStages.length; i++) {
            var sprite = this.group.create(0, 0, this.growthStages[i]);
            sprite.visible = false;
            sprite.anchor.setTo(0.5, 0.5);
            sprite.inputEnabled = true;
            sprite.events.onInputDown.add(this.handleClick, this);

            var scaleFactor = this.stageScaleFactors[i];
            sprite.scale.setTo(-potScale * scaleFactor, potScale * scaleFactor);

            sprite.x = 0;
            sprite.y = 0;
            this.stageSprites.push(sprite);
        }
    };

    FlowerPot.prototype.startGrowing = function() {
        var delay = this.getRandomGrowthDelay();
        this.growthEvent = this.game.time.events.add(delay, function() {
            this.growthEvent = null;
            this.advanceGrowth();

            if (this.currentStage >= 0 && this.currentStage < this.growthStages.length - 1) {
                this.startGrowing();
            }
        }, this);
    };

    FlowerPot.prototype.getRandomGrowthDelay = function() {
        return this.game.rnd.integerInRange(10000, 15000);
    };

    FlowerPot.prototype.advanceGrowth = function() {
        if (this.currentStage >= this.growthStages.length - 1) {
            this.stopGrowing();
            return;
        }

        this.tryMutateToGolden();

        this.stageSprites[this.currentStage].visible = false;
        this.currentStage++;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
    };

    FlowerPot.prototype.growToNextStage = function() {
        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return false;
        }

        this.tryMutateToGolden();

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

        this.tryMutateToGolden();

        this.stageSprites[this.currentStage].visible = false;
        this.currentStage = this.growthStages.length - 1;
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
        this.stopGrowing();
        return true;
    };

    FlowerPot.prototype.plantIfEmpty = function(flowerTypeId) {
        if (!this.isOperable || this.currentStage !== -1) {
            return false;
        }

        this.plantSeed(flowerTypeId || cfg.DEFAULT_FLOWER_TYPE);
        return true;
    };

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

    FlowerPot.prototype.stopGrowing = function() {
        if (this.growthEvent) {
            this.game.time.events.remove(this.growthEvent);
            this.growthEvent = null;
        }
    };

    FlowerPot.prototype.collectFlower = function() {
        var mutationCfg = cfg.MUTATION || {};
        var peonyTypeId = mutationCfg.peonyTypeId || 'peony';
        var goldenTypeId = mutationCfg.goldenTypeId || 'golden';

        if (this.currentFlowerType === goldenTypeId) {
            if (typeof this.onCollect === 'function') {
                this.onCollect(peonyTypeId, 10);
                this.onCollect(goldenTypeId, 1);
            }
            this.showCollectTip('+10朵牡丹 +1朵金花');
            this.resetPot();
            return;
        }

        var count = Math.floor(Math.random() * 3) + 1;
        if (typeof this.onCollect === 'function') {
            this.onCollect(this.currentFlowerType || cfg.DEFAULT_FLOWER_TYPE, count);
        }
        this.showCollectTip('+' + count + '朵花');
        this.resetPot();
    };

    FlowerPot.prototype.showCollectTip = function(text) {
        var tipText = this.game.add.text(this.group.x, this.group.y - 70, text, {
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

    FlowerPot.prototype.tryMutateToGolden = function() {
        var mutationCfg = cfg.MUTATION || {};
        var peonyTypeId = mutationCfg.peonyTypeId || 'peony';
        var goldenTypeId = mutationCfg.goldenTypeId || 'golden';
        var chance = mutationCfg.peonyToGoldenChance || 0;

        if (this.currentFlowerType !== peonyTypeId) {
            return;
        }

        if (this.currentStage < 0 || this.currentStage >= this.growthStages.length - 1) {
            return;
        }

        if (Math.random() >= chance) {
            return;
        }

        this.mutateFlowerType(goldenTypeId);
    };

    FlowerPot.prototype.mutateFlowerType = function(nextFlowerTypeId) {
        var stageIndex = this.currentStage;

        for (var i = 0; i < this.stageSprites.length; i++) {
            this.stageSprites[i].destroy();
        }

        this.stageSprites = [];
        this.currentFlowerType = nextFlowerTypeId;
        this.growthStages = this.buildGrowthStageKeys(nextFlowerTypeId);
        this.createStageSprites();

        this.currentStage = Math.min(stageIndex, this.growthStages.length - 1);
        this.syncStageTransforms();
        this.showStageSafely(this.currentStage);
    };

    FlowerPot.prototype.resetPot = function() {
        this.stopGrowing();

        if (this.revealEvent) {
            this.game.time.events.remove(this.revealEvent);
            this.revealEvent = null;
        }

        if (this.revealTween) {
            this.game.tweens.remove(this.revealTween);
            this.revealTween = null;
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

        if (this.revealTween) {
            this.game.tweens.remove(this.revealTween);
            this.revealTween = null;
        }

        this.revealEvent = this.game.time.events.add(100, function() {
            this.revealEvent = null;

            if (this.currentStage !== stageIndex) {
                return;
            }

            if (stageIndex >= 0 && stageIndex < this.stageSprites.length) {
                var currentSprite = this.stageSprites[stageIndex];
                currentSprite.alpha = 0;
                currentSprite.visible = true;
                this.revealTween = this.game.add.tween(currentSprite).to({
                    alpha: 1
                }, 220, Phaser.Easing.Cubic.Out, true);
                this.revealTween.onComplete.add(function() {
                    this.revealTween = null;
                }, this);
            }
        }, this);
    };

    FlowerPot.prototype.syncStageTransforms = function() {
        var potScale = (this.game.width / 6) / this.potOriginalWidth;
        var potHeight = this.potOriginalHeight * potScale;

        for (var i = 0; i < this.stageSprites.length; i++) {
            var stageSprite = this.stageSprites[i];
            var stageScaleFactor = this.stageScaleFactors[i];
            stageSprite.scale.setTo(-potScale * stageScaleFactor, potScale * stageScaleFactor);

            var stageHeight = stageSprite.height;
            var topOffset = potHeight * this.flowerTopOffsetRatio;
            stageSprite.x = 0;
            stageSprite.y = -(potHeight / 2) + topOffset - (stageHeight / 2);
        }
    };

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

        if (this.currentStage < this.growthStages.length - 1) {
            this.startGrowing();
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
