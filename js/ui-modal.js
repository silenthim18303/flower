/**
 * 弹窗动画工具模块
 * 提供弹窗的打开/关闭动画控制
 */
(function() {
    /** 关闭动画持续时间（毫秒） */
    var MODAL_CLOSE_ANIM_MS = 220;

    /**
     * 打开弹窗（带动画）
     * 清除关闭动画定时器，添加 .show 类触发展开动画
     * @param {HTMLElement} modal - 弹窗DOM元素
     */
    function openAnimatedModal(modal) {
        if (!modal) {
            return;
        }

        // 清除未完成的关闭动画
        if (modal.__closeTimer) {
            clearTimeout(modal.__closeTimer);
            modal.__closeTimer = null;
        }

        modal.classList.remove('closing');
        modal.classList.add('show');
    }

    /**
     * 关闭弹窗（带动画）
     * 移除 .show 类，添加 .closing 类触发关闭动画
     * 动画结束后移除 .closing 类
     * @param {HTMLElement} modal - 弹窗DOM元素
     */
    function closeAnimatedModal(modal) {
        if (!modal) {
            return;
        }

        // 弹窗未打开时忽略
        if (!modal.classList.contains('show') && !modal.classList.contains('closing')) {
            return;
        }

        // 清除未完成的关闭动画
        if (modal.__closeTimer) {
            clearTimeout(modal.__closeTimer);
            modal.__closeTimer = null;
        }

        modal.classList.remove('show');
        modal.classList.add('closing');

        // 动画结束后清理状态
        modal.__closeTimer = setTimeout(function() {
            modal.classList.remove('closing');
            modal.__closeTimer = null;
        }, MODAL_CLOSE_ANIM_MS);
    }

    /** 导出弹窗动画接口 */
    window.FlowerUIModal = {
        open: openAnimatedModal,
        close: closeAnimatedModal
    };
})();
