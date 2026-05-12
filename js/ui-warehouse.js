/**
 * 仓库卡片UI模块
 * 负责仓库的创建、列表渲染、折叠/展开状态管理
 */
(function() {
    var cfg = window.FLOWER_CONFIG;

    /**
     * 创建仓库卡片DOM元素
     * 包含：折叠切换按钮、花种数量列表
     * @param {Object} ctx - 共享上下文对象
     */
    function createWarehouseCard(ctx) {
        var leftTopPanel = ctx.leftTopPanel;

        var warehouseCard = document.getElementById('warehouse-card');
        if (!warehouseCard) {
            warehouseCard = document.createElement('div');
            warehouseCard.id = 'warehouse-card';
            warehouseCard.className = 'collapsed';
            warehouseCard.innerHTML = [
                '<button class="warehouse-toggle" id="warehouse-toggle" type="button">',
                '  <span class="warehouse-title">仓库</span>',
                '  <span class="warehouse-arrow" id="warehouse-arrow">▾</span>',
                '</button>',
                '<div class="warehouse-list" id="warehouse-list"></div>'
            ].join('');
        }
        if (warehouseCard.parentNode !== leftTopPanel) {
            leftTopPanel.appendChild(warehouseCard);
        }

        // 缓存DOM引用
        ctx.refs.warehouseCard = warehouseCard;
        ctx.refs.warehouseToggle = document.getElementById('warehouse-toggle');
        ctx.refs.warehouseList = document.getElementById('warehouse-list');

        // 绑定折叠切换事件
        if (ctx.refs.warehouseToggle) {
            ctx.refs.warehouseToggle.onclick = function() {
                ctx.shared.isWarehouseCollapsed = !ctx.shared.isWarehouseCollapsed;
                renderWarehouseCollapse(ctx);
            };
        }
    }

    /**
     * 渲染仓库花种列表
     * 显示各花种名称和当前数量
     * @param {Object} ctx - 共享上下文对象
     * @param {Object} state - 游戏状态对象
     */
    function renderWarehouseList(ctx, state) {
        if (!ctx.refs.warehouseList) {
            return;
        }

        var rows = [];
        for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
            var flower = cfg.FLOWER_TYPES[i];
            var count = state.warehouse[flower.id] || 0;
            rows.push(
                '<div class="warehouse-item">' +
                '<span class="warehouse-name">' + flower.name + '</span>' +
                '<span class="warehouse-count">' + count + ' 朵</span>' +
                '</div>'
            );
        }

        ctx.refs.warehouseList.innerHTML = rows.join('');
    }

    /**
     * 渲染仓库折叠状态
     * 切换 .collapsed 类控制列表显隐
     * @param {Object} ctx - 共享上下文对象
     */
    function renderWarehouseCollapse(ctx) {
        if (!ctx.refs.warehouseCard) {
            return;
        }

        ctx.refs.warehouseCard.classList.toggle('collapsed', ctx.shared.isWarehouseCollapsed);
        if (ctx.refs.warehouseToggle) {
            ctx.refs.warehouseToggle.setAttribute('aria-expanded', ctx.shared.isWarehouseCollapsed ? 'false' : 'true');
        }
    }

    /** 导出仓库卡片接口 */
    window.FlowerUIWarehouse = {
        create: createWarehouseCard,
        renderList: renderWarehouseList,
        renderCollapse: renderWarehouseCollapse
    };
})();
