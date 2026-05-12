/**
 * 每日任务弹窗UI模块
 * 负责每日任务卡片、任务进度显示、奖励领取
 */
(function() {
    var cfg = window.FLOWER_CONFIG;
    var modal = window.FlowerUIModal;

    /**
     * 创建每日任务卡片（固定在界面左侧）
     * 显示任务进度，点击打开任务弹窗
     * @param {Object} ctx - 共享上下文对象
     */
    function createDailyTaskCard(ctx) {
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
                showDailyTaskModal(ctx, window.FlowerState);
            };
            document.body.appendChild(dailyTaskCard);
        }

        // 缓存DOM引用
        ctx.refs.dailyTaskCard = dailyTaskCard;
        ctx.refs.dailyTaskProgress = document.getElementById('daily-task-progress');
    }

    /**
     * 创建每日任务弹窗DOM元素
     * 包含：任务标题、进度说明、领取按钮、关闭按钮
     * @param {Object} ctx - 共享上下文对象
     */
    function createDailyTaskModal(ctx) {
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

            // 点击遮罩层关闭弹窗
            dailyTaskModal.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute('data-close') === '1') {
                    hideDailyTaskModal(ctx);
                }
            });

            document.body.appendChild(dailyTaskModal);
        }

        // 缓存DOM引用
        ctx.refs.dailyTaskModal = dailyTaskModal;
        ctx.refs.dailyTaskModalText = document.getElementById('daily-task-modal-text');
        ctx.refs.dailyTaskModalClaimBtn = document.getElementById('daily-task-modal-claim');
        ctx.refs.dailyTaskModalClose = document.getElementById('daily-task-modal-close');

        // 绑定领取奖励按钮事件
        if (ctx.refs.dailyTaskModalClaimBtn) {
            ctx.refs.dailyTaskModalClaimBtn.onclick = function() {
                if (ctx.refs.dailyTaskModalClaimBtn.disabled) {
                    return;
                }
                if (typeof ctx.callbacks.onDailyTaskClaim === 'function') {
                    ctx.callbacks.onDailyTaskClaim();
                }
            };
        }

        // 绑定关闭按钮事件
        if (ctx.refs.dailyTaskModalClose) {
            ctx.refs.dailyTaskModalClose.onclick = function() {
                hideDailyTaskModal(ctx);
            };
        }
    }

    /**
     * 渲染每日任务状态
     * 更新进度文字、奖励说明、领取按钮状态
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderDailyTask(ctx, state) {
        if (!ctx.refs.dailyTaskProgress || !ctx.refs.dailyTaskModalText || !ctx.refs.dailyTaskModalClaimBtn) {
            return;
        }

        var taskCfg = cfg.DAILY_TASK || {};
        var goal = taskCfg.collectGoal || 0;
        var progress = state.dailyTask ? (state.dailyTask.collectProgress || 0) : 0;
        var clampedProgress = Math.min(progress, goal);
        var claimed = !!(state.dailyTask && state.dailyTask.rewardClaimed);

        // 构建奖励说明文字
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

        // 更新卡片进度
        ctx.refs.dailyTaskProgress.textContent = clampedProgress + '/' + goal;

        // 更新弹窗内容
        ctx.refs.dailyTaskModalText.textContent = '收花 ' + clampedProgress + '/' + goal + ' 朵（奖励：' + rewardParts.join('，') + '）';

        // 已领取状态
        if (claimed) {
            ctx.refs.dailyTaskModalClaimBtn.textContent = '已领取';
            ctx.refs.dailyTaskModalClaimBtn.disabled = true;
            return;
        }

        // 判断是否可领取
        var canClaim = clampedProgress >= goal && goal > 0;
        ctx.refs.dailyTaskModalClaimBtn.textContent = canClaim ? '领取奖励' : '进行中';
        ctx.refs.dailyTaskModalClaimBtn.disabled = !canClaim;
    }

    /**
     * 显示每日任务弹窗
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function showDailyTaskModal(ctx, state) {
        if (!ctx.refs.dailyTaskModal) {
            return;
        }

        if (state) {
            renderDailyTask(ctx, state);
        }
        modal.open(ctx.refs.dailyTaskModal);
    }

    /**
     * 隐藏每日任务弹窗
     * @param {Object} ctx - 共享上下文对象
     */
    function hideDailyTaskModal(ctx) {
        if (!ctx.refs.dailyTaskModal) {
            return;
        }
        modal.close(ctx.refs.dailyTaskModal);
    }

    /** 导出每日任务接口 */
    window.FlowerUIDaily = {
        createCard: createDailyTaskCard,
        createModal: createDailyTaskModal,
        render: renderDailyTask,
        show: showDailyTaskModal,
        hide: hideDailyTaskModal
    };
})();
