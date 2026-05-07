(function() {
    var cfg = window.FLOWER_CONFIG;

    var refs = {
        levelPill: null,
        expFill: null,
        expText: null,
        expPercent: null,
        warehouseList: null,
        maxLevelText: null,
        levelUpToast: null,
        seedToolbar: null
    };

    var onSeedSelect = null;

    var levelUpToastTimer = null;

    function ensureUI() {
        var levelUI = document.getElementById('level-ui');
        if (!levelUI) {
            levelUI = document.createElement('div');
            levelUI.id = 'level-ui';
            levelUI.innerHTML = [
                '<div class="level-header">',
                '  <span class="level-title">Garden Level</span>',
                '  <span class="level-pill" id="level-pill">Lv 1</span>',
                '</div>',
                '<div class="exp-track">',
                '  <div class="exp-fill" id="exp-fill"></div>',
                '</div>',
                '<div class="exp-footer">',
                '  <span class="exp-text" id="exp-text">0/100</span>',
                '  <span class="exp-percent" id="exp-percent">0%</span>',
                '</div>',
                '<div class="max-level-text" id="max-level-text">已满级，已解锁全部花盆</div>',
                '<div class="warehouse-section">',
                '  <div class="warehouse-title">仓库</div>',
                '  <div class="warehouse-list" id="warehouse-list"></div>',
                '</div>'
            ].join('');
            document.body.appendChild(levelUI);
        }

        var seedToolbar = document.getElementById('seed-toolbar');
        if (!seedToolbar) {
            seedToolbar = document.createElement('div');
            seedToolbar.id = 'seed-toolbar';

            for (var i = 0; i < cfg.FLOWER_TYPES.length; i++) {
                var flower = cfg.FLOWER_TYPES[i];
                var item = document.createElement('div');
                item.className = 'seed-item';
                item.setAttribute('data-flower-id', flower.id);
                item.innerHTML = '<img src="' + flower.logo + '" alt="' + flower.name + '"><div class="seed-name">' + flower.name + '</div>';
                item.addEventListener('click', function() {
                    var flowerId = this.getAttribute('data-flower-id');
                    if (typeof onSeedSelect === 'function') {
                        onSeedSelect(flowerId);
                    }
                });
                seedToolbar.appendChild(item);
            }

            document.body.appendChild(seedToolbar);
        }

        var levelUpToast = document.getElementById('levelup-toast');
        if (!levelUpToast) {
            levelUpToast = document.createElement('div');
            levelUpToast.id = 'levelup-toast';
            document.body.appendChild(levelUpToast);
        }

        refs.levelPill = document.getElementById('level-pill');
        refs.expFill = document.getElementById('exp-fill');
        refs.expText = document.getElementById('exp-text');
        refs.expPercent = document.getElementById('exp-percent');
        refs.warehouseList = document.getElementById('warehouse-list');
        refs.maxLevelText = document.getElementById('max-level-text');
        refs.levelUpToast = levelUpToast;
        refs.seedToolbar = seedToolbar;
    }

    function renderSeedSelection(selectedFlowerType) {
        if (!refs.seedToolbar) {
            return;
        }

        var items = refs.seedToolbar.querySelectorAll('.seed-item');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var flowerId = item.getAttribute('data-flower-id');
            if (flowerId === selectedFlowerType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }

    function renderWarehouseList(state) {
        if (!refs.warehouseList) {
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

        refs.warehouseList.innerHTML = rows.join('');
    }

    function render(state) {
        if (!refs.levelPill) {
            ensureUI();
        }

        var isMaxLevel = state.level >= cfg.MAX_LEVEL;
        var displayExp = isMaxLevel ? state.maxExp : state.exp;
        var expRatio = Math.min(displayExp / state.maxExp, 1);

        refs.levelPill.textContent = 'Lv ' + state.level;
        refs.expFill.style.width = Math.floor(expRatio * 100) + '%';
        refs.expText.textContent = displayExp + '/' + state.maxExp;
        refs.expPercent.textContent = isMaxLevel ? 'MAX' : Math.floor(expRatio * 100) + '%';
        renderWarehouseList(state);
        refs.maxLevelText.style.display = isMaxLevel ? 'block' : 'none';
        renderSeedSelection(state.selectedFlowerType);
    }

    function showLevelUpToast(level, isMaxLevel) {
        if (!refs.levelUpToast) {
            ensureUI();
        }

        if (levelUpToastTimer) {
            clearTimeout(levelUpToastTimer);
            levelUpToastTimer = null;
        }

        refs.levelUpToast.textContent = isMaxLevel
            ? '恭喜升到 Lv.' + level + '，已解锁全部花盆！'
            : '恭喜升级到 Lv.' + level + '，解锁1个新花盆！';

        refs.levelUpToast.classList.add('show');
        levelUpToastTimer = setTimeout(function() {
            refs.levelUpToast.classList.remove('show');
            levelUpToastTimer = null;
        }, 1800);
    }

    window.FlowerUI = {
        ensureUI: ensureUI,
        render: render,
        showLevelUpToast: showLevelUpToast,
        setSeedSelectHandler: function(handler) {
            onSeedSelect = handler;
        }
    };
})();
