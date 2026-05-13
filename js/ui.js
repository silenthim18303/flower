/**
 * UI主入口模块
 * 编排所有UI子模块，提供统一的渲染和交互接口
 *
 * 子模块列表：
 * - FlowerUIModal: 弹窗动画工具
 * - FlowerUILevel: 经验面板 + 改名
 * - FlowerUIWarehouse: 仓库卡片
 * - FlowerUIToolbar: 种子工具栏 + 快捷按钮
 * - FlowerUICollect: 收花统计弹窗 + 交易
 * - FlowerUIDaily: 每日任务弹窗
 * - FlowerUIExchange: 花农兑换弹窗
 * - FlowerUIHelp: 帮助弹窗
 */
(function() {
    var cfg = window.FLOWER_CONFIG;

    // 引入各子模块
    var level = window.FlowerUILevel;
    var warehouse = window.FlowerUIWarehouse;
    var toolbar = window.FlowerUIToolbar;
    var collect = window.FlowerUICollect;
    var daily = window.FlowerUIDaily;
    var exchange = window.FlowerUIExchange;
    var help = window.FlowerUIHelp;

    /**
     * DOM元素引用缓存
     * 各子模块将创建的DOM元素引用存于此处
     */
    var refs = {};

    /**
     * 事件回调函数集合
     * 由 game.js 注册，UI模块在用户操作时调用
     */
    var callbacks = {
        onSeedSelect: null,       // 花种选择回调
        onTrade: null,            // 交易完成回调
        onDailyTaskClaim: null,   // 领取每日任务奖励回调
        onQuickFertilize: null,   // 一键施肥回调
        onQuickWater: null,       // 一键浇水回调
        onQuickPlant: null,       // 一键播种回调
        onQuickHarvest: null,     // 一键采摘回调
        onNameChange: null        // 玩家昵称修改回调
    };

    /**
     * 共享状态
     * 多个模块共用的状态数据
     */
    var shared = {
        isWarehouseCollapsed: true  // 仓库是否折叠
    };

    /**
     * 共享上下文对象
     * 传递给各子模块，用于访问共享资源
     */
    var ctx = {
        refs: refs,
        callbacks: callbacks,
        shared: shared,
        render: render
    };

    /**
     * 初始化所有UI组件
     * 按顺序创建：经验面板、仓库、任务卡片、工具栏、弹窗
     */
    function ensureUI() {
        // 创建左上角面板容器
        var leftTopPanel = document.getElementById('left-top-panel');
        if (!leftTopPanel) {
            leftTopPanel = document.createElement('div');
            leftTopPanel.id = 'left-top-panel';
            document.body.appendChild(leftTopPanel);
        }
        ctx.leftTopPanel = leftTopPanel;

        // 按依赖顺序创建各组件
        level.create(ctx);           // 经验面板（需最先创建）
        level.createToast(ctx);      // 升级提示
        warehouse.create(ctx);       // 仓库卡片
        daily.createCard(ctx);       // 每日任务卡片
        toolbar.createSeedToolbar(ctx);    // 种子工具栏
        toolbar.createQuickActions(ctx);   // 快捷操作按钮
        collect.create(ctx);         // 收花统计弹窗
        daily.createModal(ctx);      // 每日任务弹窗
        exchange.create(ctx);        // 花农兑换弹窗
    }

    /**
     * 渲染所有UI组件
     * 根据当前游戏状态更新界面显示
     * @param {Object} state - 游戏状态对象
     */
    function render(state) {
        // 确保UI已初始化
        if (!refs.levelPill) {
            ensureUI();
        }

        // 更新各组件显示
        level.render(ctx, state);                    // 经验面板
        warehouse.renderCollapse(ctx);               // 仓库折叠状态
        warehouse.renderList(ctx, state);            // 仓库列表
        daily.render(ctx, state);                    // 每日任务
        exchange.render(ctx, state);                 // 花农兑换
        toolbar.renderSeedSelection(ctx, state.selectedFlowerType);  // 种子选中状态
        toolbar.renderQuickActions(ctx, state);      // 快捷按钮状态

        // 收花统计弹窗打开时同步更新内容
        if (refs.collectModal && refs.collectModal.classList.contains('show')) {
            collect.show(ctx, state);
        }
    }

    /**
     * 导出UI接口
     * 供 game.js 调用的统一接口
     */
    window.FlowerUI = {
        /** 初始化UI */
        ensureUI: ensureUI,
        /** 渲染UI */
        render: render,

        /**
         * 显示升级提示
         * @param {number} levelNum - 升到的等级
         * @param {boolean} isMaxLevel - 是否满级
         */
        showLevelUpToast: function(levelNum, isMaxLevel) {
            level.showLevelUpToast(ctx, levelNum, isMaxLevel);
        },

        /**
         * 显示收花统计弹窗
         * @param {Object} [state] - 游戏状态，默认使用 FlowerState
         */
        showCollectModal: function(state) {
            collect.show(ctx, state || window.FlowerState);
        },

        /** 隐藏收花统计弹窗 */
        hideCollectModal: function() {
            collect.hide(ctx);
        },

        /**
         * 显示花农兑换弹窗
         * @param {Object} [state] - 游戏状态，默认使用 FlowerState
         */
        showGoldenExchangeModal: function(state) {
            exchange.show(ctx, state || window.FlowerState);
        },

        /**
         * 注册交易完成回调
         * @param {Function} handler - 回调函数
         */
        setTradeHandler: function(handler) {
            callbacks.onTrade = handler;
        },

        /**
         * 注册领取每日任务奖励回调
         * @param {Function} handler - 回调函数
         */
        setDailyTaskClaimHandler: function(handler) {
            callbacks.onDailyTaskClaim = handler;
        },

        /**
         * 注册快捷操作回调
         * @param {Object} handlers - 回调函数集合
         * @param {Function} handlers.onFertilize - 一键施肥
         * @param {Function} handlers.onWater - 一键浇水
         * @param {Function} handlers.onPlant - 一键播种
         * @param {Function} handlers.onHarvest - 一键采摘
         */
        setQuickActionHandlers: function(handlers) {
            callbacks.onQuickFertilize = handlers && handlers.onFertilize;
            callbacks.onQuickWater = handlers && handlers.onWater;
            callbacks.onQuickPlant = handlers && handlers.onPlant;
            callbacks.onQuickHarvest = handlers && handlers.onHarvest;
        },

        /**
         * 注册花种选择回调
         * @param {Function} handler - 回调函数，参数为花种ID
         */
        setSeedSelectHandler: function(handler) {
            callbacks.onSeedSelect = handler;
        },

        /**
         * 注册昵称修改回调
         * @param {Function} handler - 回调函数，参数为新昵称
         */
        setNameChangeHandler: function(handler) {
            callbacks.onNameChange = handler;
        },

        /**
         * 显示帮助弹窗
         */
        showHelpModal: function() {
            help.show();
        }
    };
})();
