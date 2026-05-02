(function() {
    var flowerSprites = [];
    var flowerScaleValues = [0.3, 0.6, 1];
    var flowerCycleSeconds = 5 * 60;
    var flowerStepSeconds = flowerCycleSeconds / (flowerScaleValues.length - 1);
    var growthCycleCount = 0;
    var countValueText = null;

    var game = new Phaser.Game(1080, 1920, Phaser.AUTO, 'game-root', {
        preload: preload,
        create: create
    });

    // 预加载阶段。
    // 1) 注册加载成功/失败日志，方便排查资源路径问题。
    // 2) 统一加载本关卡所需图片：背景、计数图标、手推车图标、花朵。
    // 说明：这里只做资源准备，不做任何场景实例化。
    function preload() {
        game.load.onFileComplete.add(function(progress, key) {
            console.log('[LOAD OK]', key, progress + '%');
        });

        game.load.onFileError.add(function(key, file) {
            console.error('[LOAD ERROR]', key, file);
        });

        game.load.image('grass2', 'assets/grass2.png');
        game.load.image('count', 'assets/count.png');
        game.load.image('handcar', 'assets/handcar.png');
        game.load.image('flower', 'assets/flower.png');
    }

    // 创建阶段（主初始化入口）。
    // 1) 设置缩放与页面居中策略，保证不同分辨率下可见区域稳定。
    // 2) 绘制背景图。
    // 3) 按网格批量创建花朵，并为每朵花初始化进度条与生长状态。
    // 4) 初始化左上角计数 UI（有图标时覆盖在图标中间，无图标时走文本兜底）。
    // 5) 初始化右上角手推车图标（无图标时走文本兜底）。
    // 6) 绑定全局点击事件，交给 onGameTap 统一处理。
    function create() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = '#8ec5ff';

        if (game.cache.checkImageKey('grass2')) {
            var grass2 = game.add.image(game.world.centerX, game.world.centerY, 'grass2');
            grass2.anchor.set(0.5);
            grass2.width = game.width;
            grass2.height = game.height;
        }

        if (game.cache.checkImageKey('flower')) {
            var rows = 6;
            var cols = 4;
            var minY = game.height * 0.1;
            var maxY = game.height * 0.9;
            var xStep = game.width / (cols + 1);
            var yStep = (maxY - minY) / (rows + 1);

            flowerSprites = [];

            for (var row = 0; row < rows; row++) {
                for (var col = 0; col < cols; col++) {
                    var flowerX = xStep * (col + 1);
                    var flowerY = minY + yStep * (row + 1);
                    var flower = game.add.image(flowerX, flowerY, 'flower');
                    flower.anchor.set(0.5);

                    flower.progressBarBg = game.add.graphics(flowerX, flowerY + 48);
                    flower.progressBarBg.beginFill(0x000000, 0.35);
                    flower.progressBarBg.drawRoundedRect(-36, -5, 72, 10, 5);
                    flower.progressBarBg.endFill();

                    flower.progressBarFill = game.add.graphics(flowerX, flowerY + 48);
                    flowerSprites.push(flower);

                    applyFlowerState(flower, 0, false);
                    startFlowerGrowthFor(flower);
                }
            }
        }

        if (game.cache.checkImageKey('count')) {
            var count = game.add.image(40, 40, 'count');
            count.anchor.set(0, 0);

            countValueText = game.add.text(
                count.x + count.width / 2,
                count.y + count.height / 2,
                String(growthCycleCount),
                { font: 'bold 48px Arial', fill: '#000000' }
            );
            countValueText.anchor.set(0.5);
        } else {
            game.add.text(40, 40, 'COUNT', { font: '36px Arial', fill: '#000000' });
            countValueText = game.add.text(40, 90, String(growthCycleCount), { font: 'bold 48px Arial', fill: '#ffffff' });
        }

        if (game.cache.checkImageKey('handcar')) {
            var handcar = game.add.image(game.width - 40, 40, 'handcar');
            handcar.anchor.set(1, 0);
        } else {
            game.add.text(game.width - 40, 40, 'HANDCAR', { font: '30px Arial', fill: '#ffffff' }).anchor.set(1, 0);
        }

        game.input.onTap.add(onGameTap, this);
    }

    // 设置单朵花的生长状态。
    // 参数：
    // - flower: 花朵精灵对象。
    // - nextState: 目标状态索引（会自动夹紧到合法区间）。
    // - useTween: 是否使用补间动画过渡缩放。
    // 行为：
    // - 更新 growthState 与目标缩放值。
    // - 同步刷新进度条长度与颜色。
    // - 若已有旧补间，先停止，避免并发动画导致状态错乱。
    function applyFlowerState(flower, nextState, useTween) {
        var clampedState = Math.max(0, Math.min(nextState, flowerScaleValues.length - 1));
        flower.growthState = clampedState;
        var targetScale = flowerScaleValues[clampedState];
        updateFlowerProgressBar(flower, targetScale);

        if (flower.scaleTween) {
            flower.scaleTween.stop();
            flower.scaleTween = null;
        }

        if (useTween) {
            flower.scaleTween = game.add.tween(flower.scale).to(
                { x: targetScale, y: targetScale },
                360,
                Phaser.Easing.Elastic.Out,
                true
            );

            flower.scaleTween.onComplete.addOnce(function() {
                flower.scale.set(targetScale);
                flower.scaleTween = null;
            }, this);
        } else {
            flower.scale.set(targetScale);
        }
    }

    // 重绘花朵下方进度条。
    // 参数：
    // - flower: 当前花朵对象（内部需包含 progressBarFill）。
    // - progressRatio: 0~1 的进度比例，超出会被夹紧。
    // 视觉规则：
    // - 阶段 0：绿色（生长中）。
    // - 阶段 1：橙色（接近成熟）。
    // - 阶段 2+：红色（成熟可收割）。
    // 说明：该方法只负责渲染条形 UI，不修改生长计时逻辑。
    function updateFlowerProgressBar(flower, progressRatio) {
        if (!flower.progressBarFill) {
            return;
        }

        var clampedProgress = Math.max(0, Math.min(progressRatio, 1));
        var totalWidth = 72;
        var fillWidth = totalWidth * clampedProgress;
        var fillColor = 0x22c55e;

        if (flower.growthState === 1) {
            fillColor = 0xf59e0b;
        } else if (flower.growthState >= 2) {
            fillColor = 0xef4444;
        }

        flower.progressBarFill.clear();
        flower.progressBarFill.beginFill(fillColor, 0.95);
        flower.progressBarFill.drawRoundedRect(-36, -5, fillWidth, 10, 5);
        flower.progressBarFill.endFill();
    }

    // 启动或重启某朵花的生长流程。
    // 处理步骤：
    // - 清理旧的 growthEvent（如果存在），避免重复计时。
    // - 递增 growthToken，标记“当前有效生长周期”。
    // - 进入 scheduleNextFlowerGrowth 安排下一次阶段增长。
    // 设计意图：通过 token + 定时器清理，确保状态切换可重复且可中断。
    function startFlowerGrowthFor(flower) {
        if (flower.growthEvent) {
            game.time.events.remove(flower.growthEvent);
            flower.growthEvent = null;
        }

        flower.growthToken = (flower.growthToken || 0) + 1;
        scheduleNextFlowerGrowth(flower, flower.growthToken);
    }

    // 为花朵安排“下一次”生长。
    // 参数：
    // - flower: 当前花朵。
    // - growthToken: 调度时捕获的周期令牌，用于校验任务是否过期。
    // 关键点：
    // - 若 token 不匹配，说明这次回调属于旧周期，直接丢弃。
    // - 若已达到最大状态，则终止调度。
    // - 否则按固定步长延时后进入下一状态，并继续递归调度直到成熟。
    function scheduleNextFlowerGrowth(flower, growthToken) {
        if (growthToken !== flower.growthToken) {
            return;
        }

        if (flower.growthState >= flowerScaleValues.length - 1) {
            flower.growthEvent = null;
            return;
        }

        flower.growthEvent = game.time.events.add(Phaser.Timer.SECOND * flowerStepSeconds, function() {
            if (growthToken !== flower.growthToken) {
                return;
            }

            flower.growthEvent = null;

            if (flower.growthState < flowerScaleValues.length - 1) {
                applyFlowerState(flower, flower.growthState + 1, true);
                scheduleNextFlowerGrowth(flower, growthToken);
            }
        }, this);
    }

    // 收集当前所有“成熟花”（最大状态）的引用列表。
    // 返回值：成熟花数组；若没有成熟花则返回空数组。
    // 用途：供点击检测与批量收割逻辑复用。
    function getMaxStateFlowers() {
        var maxStateFlowers = [];

        for (var i = 0; i < flowerSprites.length; i++) {
            if (flowerSprites[i].growthState === flowerScaleValues.length - 1) {
                maxStateFlowers.push(flowerSprites[i]);
            }
        }

        return maxStateFlowers;
    }

    // 批量收割当前成熟花。
    // 执行流程：
    // 1) 查询成熟花列表；为空则直接返回。
    // 2) 按收割数量累计到 growthCycleCount，并刷新计数文本。
    // 3) 将每朵成熟花重置为初始状态（state=0），并重启生长流程。
    // 说明：该方法只处理“已经成熟”的花，不影响未成熟花朵。
    function resetAllMaxFlowers() {
        var maxStateFlowers = getMaxStateFlowers();
        if (maxStateFlowers.length === 0) {
            return;
        }

        growthCycleCount += maxStateFlowers.length;
        if (countValueText) {
            countValueText.text = String(growthCycleCount);
        }

        for (var i = 0; i < maxStateFlowers.length; i++) {
            applyFlowerState(maxStateFlowers[i], 0, false);
            startFlowerGrowthFor(maxStateFlowers[i]);
        }
    }

    // 全局点击入口。
    // 逻辑：
    // - 先拿到成熟花列表。
    // - 判断点击坐标是否命中任意成熟花的包围盒。
    // - 仅当命中成熟花时，触发 resetAllMaxFlowers 进行批量收割。
    // 结果：点击未成熟花或空白区域不会改变任何状态。
    function onGameTap(pointer) {
        var maxStateFlowers = getMaxStateFlowers();
        var tappedMaxFlower = false;

        for (var i = 0; i < maxStateFlowers.length; i++) {
            if (maxStateFlowers[i].getBounds().contains(pointer.x, pointer.y)) {
                tappedMaxFlower = true;
                break;
            }
        }

        if (!tappedMaxFlower) {
            return;
        }

        resetAllMaxFlowers();
    }
})();
